'use strict';

var _      = require('lodash');
var React  = require('react');
var moment = require('moment');
var d3     = require('d3');
var colors           = require('colors');

var Access             = require('dashboard/management/Access.jsx');
var BulletChartSection = require('./BulletChartSection.jsx');

var PolioCasesYTD = require('dashboard/management/PolioCasesYTD.jsx');
var Chart            = require('component/Chart.jsx');
var DashboardActions = require('actions/DashboardActions');

function series(values, name) {
  return {
    name: name,
    values: _.sortBy(values, _.result('campaign.start_date.getTime'))
  };
}

var ManagementDashboard = React.createClass({
  propTypes : {
    dashboard  : React.PropTypes.object.isRequired,
    indicators : React.PropTypes.object.isRequired,

    campaign   : React.PropTypes.object,
    data       : React.PropTypes.object,
    loading    : React.PropTypes.bool,
    location     : React.PropTypes.object,
  },

  getDefaultProps : function () {
    return {
      data    : [],
      loading : true
    };
  },

  render : function () {
    var campaign   = this.props.campaign;
    var printDate  = moment(campaign.start_date).format('MMM YYYY');
    var data       = this.props.data;
    var indicators = _.indexBy(this.props.indicators, 'id');
    var loading    = this.props.loading;
    var location     = _.get(this.props, 'location.name', '');
    var upper    = moment(campaign.start_date, 'YYYY-MM-DD');
    var lower    = upper.clone().startOf('month').subtract(1, 'year');


    var sections = _(this.props.dashboard.charts)
      .groupBy('section')
      .transform(function (result, charts, sectionName) {
        var section = {};
        _.each(charts, (c, i) => {
          section[_.camelCase(_.get(c, 'title', i))] = _.map(c.indicators, ind => indicators[ind]);
        });

        result[sectionName] = section;
      })
      .value();

  var stack = d3.layout.stack()
      .order('default')
      .offset('zero')
      .values(_.property('values'))
      .x(_.property('campaign.start_date'))
      .y(_.property('value'));


    var missed = _(data.performance.missedChildren)
      .reject(d => {
        return d.value <= 0.001
      })
      .groupBy('indicator.short_name')
      .map(series)
      .thru(stack)
      .value();

    var missedScale = _.map(d3.time.scale()
        .domain([lower.valueOf(), upper.valueOf()])
        .ticks(d3.time.month, 1),
        _.method('getTime')
    );

    var missedChildrenMap = data.performance.missedChildrenByProvince;

    var pct = d3.format('%');

    var impact = (
        <div className='medium-2 columns'>
            <PolioCasesYTD data={data.impact.polioCasesYtd} campaign={this.props.campaign} loading={loading} />
        </div>
    );

    var performance = (
        <div>
            <section className='medium-2 columns'>
              <h4>Missed Children</h4>
                  <Chart type='ChoroplethMap'
                    data={missedChildrenMap}
                    loading={loading}
                    options={{
                      domain  : _.constant([0, 0.1]),
                      value   : _.property('properties[475]'),
                      yFormat : d3.format('%'),
                      onClick : d => { DashboardActions.navigate({ location : d }) }
                    }} />
            </section>

            <div className='medium-2 columns'>
                <section>
                    <h4>Missed Children</h4>
                    <Chart type='ColumnChart' data={missed}
                      loading={loading}
                      options={{
                        aspect  : 2.26,
                        color   : _.flow(_.property('name'), d3.scale.ordinal().range(colors)),
                        domain  : _.constant(missedScale),
                        x       : d => moment(d.campaign.start_date).startOf('month').valueOf(),
                        xFormat : d => moment(d).format('MMM YYYY'),
                        yFormat : pct
                      }} />
                </section>
            </div>
        </div>
    );

    return (
      <div id='management-dashboard'>
        <div className='row print-only'>
          <div className='small-12 columns'>
            <h1>
              <span className='campaign'>{ printDate }</span>
              <span className='location'>{ location }</span>
            </h1>
            <h2>
              Polio<br />
              Performance<br />
              Dashboard
            </h2>
            <img src='/static/img/UNICEF.svg' className='logo'/>
          </div>
        </div>

        <div className='row'>
            {performance}
            {impact}
        </div>

      </div>
    );
  },
});

module.exports = ManagementDashboard;
