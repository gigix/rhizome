'use strict';
var React = require('react');

var Footer = React.createClass({
  render:function(){
    return(
        <div className='footer'>
          <nav className='top-bar' data-topbar role='navigation'>
              <section>
                <ul className='right'>
                  <li>
                    <a href='/about'>ABOUT</a>
                  </li>

                  <li>
                    <a href="#">SITEMAP</a>
                  </li>

                  <li>
                    <a href="#">REPORT A BUG</a>
                  </li>

                  <li>
                    <a href="#">CONTACT US</a>
                  </li>
                </ul>
              </section>
          </nav>
        </div>
    );
  }

});

module.exports = Footer;