/* global window */

'use strict';

var dom = require('../../util/dom');

module.exports = {
	template: require('./template.html'),
	paramAttributes: [
		'placeholder',
		'searchable',
		'multi',
		'loading',
		'loadedEvent'
	],
	data: {
		pattern: ''
	},
	ready: function () {
		this.searchable = this.searchable === 'true';
		this.multi = this.multi === 'true';

		this.$on(this.loadedEvent, function () { this.loading = false; });
		this.$watch('open', this.onToggle);
	},
	computed: {
		value: function () {
			return this.items.filter(function (o) { return o.selected; })
				.map(function (o) { return o.value; });
		},
		title: function () {
			return this.placeholder;
		},
	},
	methods: {
		onToggle: function () {
			if (this.searchable) {
				var inpt = this.$el.getElementsByTagName('input')[0];

				// Reset the query
				this.pattern = '';

				if (this.open) {
					inpt.focus();
				}
			}

			if (this.open) {
				window.addEventListener('resize', this);
				window.addEventListener('click', this);
				window.addEventListener('keyup', this);
				this.invalidateSize();

				this.$el.getElementsByTagName('ul')[0].scrollTop = 0;
			} else {
				window.removeEventListener('resize', this);
				window.removeEventListener('click', this);
				window.removeEventListener('keyup', this);
			}
		},
		onClick: function (item) {
			if (this.multi) {
				item.selected = !item.selected;
			} else {
				this.items.forEach(function (o) { o.selected = false; });
				item.selected = true;
				this.open = false;
			}

			this.$dispatch('selection-changed', {
				selected: this.items.filter(function (o) { return o.selected; }),
				changed: item
			});
		},
		handleEvent: function (evt) {
			switch (evt.type) {
			case 'keyup':
				// ESC
				if (evt.keyCode === 27) {
					this.open = false;
				}
				break;
			case 'click':
				if (!dom.contains(this.$el.getElementsByClassName('container')[0], evt)) {
					this.open = false;
				}
				break;
			case 'resize':
				this.invalidateSize();
				break;
			default:
				break;
			}
		},
		invalidateSize: function () {
			var menu = this.$el.getElementsByClassName('container')[0],
				ul = menu.getElementsByTagName('ul')[0],
				style = window.getComputedStyle(menu),
				marginBottom = parseInt(style.getPropertyValue('margin-bottom'), 10),
				marginRight = parseInt(style.getPropertyValue('margin-right'), 10),
				offset = dom.viewportOffset(ul);

			if (this.multi) {
				var dims = dom.dimensions(menu.getElementsByClassName('selection-controls')[0], true);
				marginBottom += dims.height;
			}

			this.menuHeight = window.innerHeight - offset.top - marginBottom;
			this.menuWidth = window.innerWidth - offset.left - marginRight;
		},
		clear: function () {
			this.items.forEach(function (o) { o.selected = false; });
		},
		invert: function () {
			this.items.forEach(function (o) { o.selected = !o.selected; });
		},
		selectAll: function () {
			this.items.forEach(function (o) { o.selected = true; });
		}
	}
};