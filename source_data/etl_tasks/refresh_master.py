import traceback

from decimal import InvalidOperation
from pprint import pprint
import json

from django.db import IntegrityError
from django.db import transaction
from django.core.exceptions import ValidationError, ObjectDoesNotExist
from pandas import DataFrame

from source_data.models import *
from datapoints.models import *

class MasterRefresh(object):
    '''
    Take source datapoints from a document_id and upsert into datapoitns table
    based on mapping and audits from the doc_review app.
    '''

    def __init__(self,user_id,document_id):

        self.document_id = document_id
        self.user_id = user_id

        self.new_datapoints = []
        self.document_metadata = {
            'instance_guid':'uq_id',
            'file_type':'columns_are_indicators',
            'region_column':'Wardcode',
            'campaign_column':'Campaign',
        }

        map_df_cols = ['master_object_id','source_object_code','content_type']

        self.source_map_dict =  DataFrame(list(SourceObjectMap.objects.all()\
            .values_list(*['master_object_id']))\
            ,columns = ['master_object_id']\
            ,index= SourceObjectMap.objects.all()\
            .values_list(*['content_type','source_object_code']))\
            .to_dict()['master_object_id']


    def source_submissions_to_doc_datapoint(self):

        source_dp_json = SourceSubmission.objects.filter(
            document_id = self.document_id).values()

        for i,(row) in enumerate(source_dp_json):
            self.process_source_submission(row)

    def doc_dps_to_datapoint(self):

        pass

    def source_dps_to_dps(self):
        '''
        TO DO - what if there are new mappings?
        '''
        x = DocDataPoint.objects.filter(document_id = self.document_id)[0]
        if not x:
            self.source_submissions_to_doc_datapoint()

        self.doc_dps_to_datapoint()

        return []

    def process_source_submission(self,ss_row):

        submission_data = json.loads(ss_row['submission_json'])
        region_code = submission_data[self.document_metadata['region_column']]
        campaign_code = submission_data[self.document_metadata['campaign_column']]

        dp_batch = []

        try:
            region_id = self.source_map_dict[('region',region_code)]
        except KeyError:
            return

        try:
            campaign_id = self.source_map_dict[('campaign',campaign_code)]
        except KeyError:
            return

        for k,v in submission_data.iteritems():

            dp_obj = self.process_submission_instance(region_id,campaign_id,k,v,ss_row['id'])

            if dp_obj:
                dp_batch.append(dp_obj)

        DocDataPoint.objects.bulk_create(dp_batch)


    def process_submission_instance(self,region_id,campaign_id,ind_code,val,ss_id):

        try:
            indicator_id = self.source_map_dict[('indicator',ind_code)]
        except KeyError:
            return None

        try:
            cleaned_val = float(val)
        except ValueError:
            return

        doc_dp_obj = DocDataPoint(**{
            'document_id':self.document_id,
            'region_id':region_id,
            'campaign_id':campaign_id,
            'indicator_id':indicator_id,
            'value':val,
            'changed_by_id':self.user_id,
            'source_submission_id':ss_id,
            'is_valid':False
        })

        return doc_dp_obj


    def clean_cell_value(self,cell_value):

        if cell_value == None:
            return None

        try:
            cleaned = float(cell_value.replace(',',''))
        except ValueError:
            cleaned = None

        return cleaned

    def delete_un_mapped(self):

        datapoint_ids = MissingMapping.objects.filter(document_id=\
            self.document_id).values_list('datapoint_id',flat=True)

        MissingMapping.objects.filter(document_id=self.document_id).delete()

        DataPoint.objects.filter(id__in=datapoint_ids).delete()


    def sync_regions(self):

        mapped_source_regions = RegionMap.objects.filter(source_object__document_id=self.document_id)


        for sr in mapped_source_regions:

            try:
                source_polygon = SourceRegionPolygon.objects.get(source_region=\
                    sr.source_region)

            except ObjectDoesNotExist:
                return

            master_polygon = RegionPolygon.objects.get_or_create(
                region = sr.master_region,
                defaults = { 'shape_len': source_polygon.shape_len,
                    'shape_area':source_polygon.shape_area,
                    'polygon': source_polygon.polygon
                })


def create_source_meta_data(document_id):
    '''
    based on the source datapoints, create the source_regions /
    source_campaigns / source indicators/
    '''

    sdp_df = DataFrame(list(SourceDataPoint.objects.filter(
        document_id = document_id).values()))

    sr_df = DataFrame(list(SourceRegion.objects.filter(
        document_id = document_id).values()))

    if len(sr_df) > 0 and len(sdp_df) == 0:

        pass

    else:

        ## campaigns ##

        campaign_strings = sdp_df['campaign_string'].unique()

        for cntr,(c) in enumerate(campaign_strings):

            try:
                created, s_c_obj = SourceCampaign.objects.create(
                    campaign_string = c,
                    document_id = document_id,
                    source_guid = ('%s - %s',( document_id, c )))
            except IntegrityError:
                pass
            except TypeError: # fix for POL-332
                pass

        ## indicators ##
        indicator_strings = sdp_df['indicator_string'].unique()

        for i in indicator_strings:

            try:
                s_i_obj = SourceIndicator.objects.create(
                    indicator_string = i,
                    document_id = document_id,
                    source_guid =  ('%s - %s',( document_id, i )))
            except IntegrityError:
                pass

        # regions #
        region_codes = sdp_df['region_code'].unique()

        for r in region_codes:

            try:
                s_r_obj = SourceRegion.objects.create(
                    region_code = r,
                    document_id = document_id,
                    region_string = r,
                    source_guid = ('%s - %s',( document_id, r )))
            except IntegrityError:
                pass
