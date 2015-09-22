var React = require('react');
var Router = require('react-router');
var {Route, DefaultRoute, RouteHandler, Link} = Router;

var AdminApp = React.createClass({
	contextTypes: {
		router: React.PropTypes.func
	},

	render: function() {
		var q_params = this.context.router.getCurrentParams()

		return <div className="admin-container">
			<h1 className="admin-header">Admin Lists: </h1>
			<ul className="admin-nav">
				<li><Link to="manage" params={q_params} >Manage Indicators</Link></li>
				<li><Link to="users">Users</Link></li>
				<li><Link to="roles">Roles</Link></li>
				<li><Link to="locations">locations</Link></li>
				<li><Link to="campaigns">Campaigns</Link></li>
				<li><Link to="indicators">Indicators</Link></li>
			</ul>
			<RouteHandler />
		</div>;
	}
});

var routes = (
		<Route name="app" path="/ufadmin/" handler={AdminApp}>
			<Route name="manage" path="/ufadmin/manage/:id" handler={require('./SimpleForm')} />
			<Route name="users" handler={require('./UsersAdmin')} />
			<Route name="roles" handler={require('./GroupsAdmin')} />
			<Route name="locations" handler={require('./RegionAdmin')} />
			<Route name="campaigns" handler={require('./CampaignsAdmin')} />
			<Route name="indicators" handler={require('./IndicatorsAdmin')} />
	</Route>
);

module.exports = {
	render: function(container) {
		Router.run(routes, Router.HistoryLocation, Handler => {
			React.render(<Handler />, container)
		})
	}
};
