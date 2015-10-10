'use strict';

var _ = require('lodash');
var React = require('react');
var Reflux = require('reflux');

var NavMenu = require('component/NavMenu.jsx');
var NavMenuItem = require('component/NavMenuItem.jsx');
var NavigationStore = require('stores/NavigationStore');
var PermissionStore = require('stores/PermissionStore');

var Navigation = React.createClass({
  mixins: [
    Reflux.connect(NavigationStore)
  ],

  render : function () {
    var dashboards = NavMenuItem.fromArray(_(this.state.dashboards)
      .filter(d => d.builtin || d.owned_by_current_user)
      .map(function(d) {
        return _.assign({
          key: 'dashboard-nav-' + d.id
        }, d);
      })
      .value()
    );

      var formLink = <NavMenuItem href='/datapoints/entry'>Enter Data via Form</NavMenuItem>
      var uploadLink = <NavMenuItem href='/datapoints/source-data'>Upload Data via CSV File</NavMenuItem>

      var enterData = (
          <li className='data'>
            <NavMenu text={'Enter Data'} icon={'fa-table'}>
              {formLink}
              {uploadLink}
            </NavMenu>
          </li>
        );


    var manage = (
        <li>
          <a href='/ufadmin/users'>
            <i className='fa fa-cogs'></i>&ensp;Manage System
          </a>
        </li>
      );

    return (
        <div className='row'>
        <nav class="top-bar" data-topbar role="navigation">
          <section className="top-bar-section  medium-4 columns">
            <ul className='left'>
              <li className='home item'><a href='/'>Rhizome DB</a></li>

              <li className='dashboard item'>
                <NavMenu text={'Explore Data'} icon={'fa-bar-chart'}>
                  {dashboards}

                  <li className='separator'><hr /></li>

                  <NavMenuItem href='/datapoints/table'>Data Browser</NavMenuItem>

                  <li className='separator'><hr /></li>

                  <NavMenuItem href='/datapoints/dashboards/'>
                    See all custom dashboards
                  </NavMenuItem>

                  <NavMenuItem href='/datapoints/dashboards/edit'>
                    Create New dashboard
                  </NavMenuItem>
                </NavMenu>
              </li>
              {enterData}
              {manage}
            </ul>
            </section>

           <ul className='logo medium-4 columns'>
            <li>
              <img src="/static/img/layout_set_logo.png" alt="Rhizome Logo" width="100%" />
              </li>
          </ul>

                    <section className="top-bar-section medium-4 columns">

            <ul className='right'>
              <li>
                <a href='/accounts/logout?next=/' title='logout'>
                  log out&ensp;<i className='fa fa-lg fa-sign-out'></i>
                </a>
              </li>
            </ul>
          </section>
        </nav>
          </div>
    );
  }
});

module.exports = Navigation;
