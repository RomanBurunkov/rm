/**
 * RESOURCE MANAGER(RM): Helps to dynamically add scripts and CSS to the page.
 * Created on 8th July 2020.
 * Author Roman Burunkov <romon2002@gmail.com>
 * version 0.0.4 of 30th May 2026.
 */

// eslint-disable-next-line no-extra-semi
;(function(instance) {
  // On a high load some browsers can load script for ages because of low priority.
  // Setting importance attribute can help resolving that.
  const SCRIPT_IMPORTANCE = 'high';
  // Maximum files to add when loading from an array.
  const MAX_RECURSIVE_LOAD = 20;

  /** RM logging styles for light theme: [time, prefix, message text] */
  const LOG_STYLES_LIGHT = ['color:green;', 'color:blue;', 'color:black;'];
  /** RM logging styles for dark theme: [time, prefix, message text] */
  const LOG_STYLES_DARK = ['color:yellow;', 'color:teal;', 'color:lightgray;'];

  /**
   * Gets the appropriate log styles based on the current color scheme.
   * @returns {Array.<string>} - an array of log styles.
   */
  function getLogStyles() {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return isDark ? LOG_STYLES_DARK : LOG_STYLES_LIGHT;
  }

  /**
   * logMsg: Logs module's messages.
   * @param {string} msg - message to log.
   */
  const logMsg = (msg) => {
    const date = new Date();
    const hh = `${date.getHours()}`.padStart(2, '0');
    const mm = `${date.getMinutes()}`.padStart(2, '0');
    const ss = `${date.getSeconds()}`.padStart(2, '0');
    // eslint-disable-next-line no-console
    console.log(`%c[${hh}:${mm}:${ss}] %cRM%c::${msg}`, ...getLogStyles());
  }

  /**
   * findResource: Searches for a resource by its URL.
   * @param {Array.<Object>} resources - an array of resources (scripts, CSS, etc.).
   * @param {string} url - resource URL to search for.
   * @returns {boolean|Object} - resource object or false if the resource is not found.
   */
  const findResource = (resources, url) => {
    if (!Array.isArray(resources)) return false;
    const res = resources.find(r => r && r.url === url);
    return res !== undefined ? res : false;
  };

  /**
   * addNewResource: Adds new resource to the resources array.
   * @param {Array.<Object>} resources - resources array.
   * @param {string} url - resource URL. 
   * @param {string} state - resource state: new/pending/fulfilled/rejected.
   * @returns {Object} - resource object.
   */
  const addNewResource = (resources, url, state = 'new') => {
    if (!url) return false;
    resources.push({ url, state });
    return resources[resources.length - 1];
  };

  /**
   * initResources: Initialize already loaded resources.
   * @param {string} resSelector - CSS selector for the resources.
   * @param {string} srcAttr - attribute name for the resource URL.
   * @param {Array.<Object>} resources - resources array.
   */
  const initResources = (resSelector, srcAttr, resources) => {
    const elements = document.querySelectorAll(resSelector);
    // Existing scripts initialization.
    elements.forEach((el) => {
      const src = el.getAttribute(srcAttr);
      if (!src) return;
      const check = findResource(resources, src);
      if (check && check.state !== 'rejected') return;
      addNewResource(resources, src, 'fulfilled');
    });
  };

  /**
   * loadScript: Adds javascript to the page.
   * @param {string} url - URL of the script to load.
   * @return {Promise} - a promise which resolves after script added to the page.
   */
  const loadScript = (url) => {
    const script = document.createElement('script');
    script.setAttribute('importance', SCRIPT_IMPORTANCE);
    return new Promise((resolve, reject) => {
      script.onerror = () => {
        script.remove();
        reject(new Error(`Failed to load script: ${url}`));
      };
      script.onload = () => resolve();
      document.head.appendChild(script);
      script.src = url;
    });
  };

  /**
   * loadCss: Adds CSS to the page.
   * @param {string} url - URL of the CSS file to load.
   * @return {Promise<void>} - a promise which resolves after CSS file added to the page.
   */
  const loadCss = (url) => {
    const link = document.createElement('link');
    return new Promise((resolve, reject) => {
      link.onerror = () => {
        link.remove();
        reject(new Error(`Failed to load CSS: ${url}`));
      };
      link.onload = () => resolve();
      link.rel = 'stylesheet';
      link.type = 'text/css';
      document.head.appendChild(link);
      link.href = url;
    });
  };

  /**
   * recursiveLoad: Recursively loads an array of files by array order.
   * @param {Array.<string>} urls - array of files URLs. 
   * @param {*} loadMethod - method to load a file.
   * @param {*} counter - counter to check limits.
   * @return {Promise<void>} - Resolves when all files has been added.
   */
  function recursiveLoad(urls, loadMethod, counter = 0) {
    if (!Array.isArray(urls) || urls.length === 0) return Promise.resolve();
    if (counter > MAX_RECURSIVE_LOAD) {
      logMsg(`Recursive load limit reached!`);
      return Promise.resolve();
    }
    const url = urls[0];
    if (!url) return recursiveLoad.call(this, urls.slice(1), loadMethod);
    return new Promise((resolve, reject) => {
      loadMethod.call(this, url)
        .then(() => recursiveLoad.call(this, urls.slice(1), loadMethod, counter + 1))
        .then(() => resolve())
        .catch((e) => reject(e));
    });
  }

  class RESOURCE_MANAGER {

    /**
     * loadScript: Adds javascript file(s) to the page
     * @param {Array.<string>|string} url - url(s) for javascript files.
     */
    loadScript(url) {
      if (Array.isArray(url)) return recursiveLoad.call(this, url, this.loadScript);
      const findings = findResource(this.scripts, url);
      const script = findings === false ? addNewResource(this.scripts, url) : findings;
      if (script.state === 'fulfilled') {
        logMsg(`Script ${url} already had been loaded.`);
        return Promise.resolve(script);
      }
      if (script.state === 'pending') return script.promise;
      script.promise = new Promise((resolve, reject) => {
        script.state = 'pending';
        loadScript(url)
          .then(() => {
            script.state = 'fulfilled';
            delete(script.promise);
            logMsg(`Script ${url} has been loaded.`);
            resolve(script);
          }).catch((e) => {
            script.state = 'rejected';
            delete(script.promise);
            logMsg(e.message || e);
            reject(e);
          })
      });
      return script.promise;
    }

    /**
     * loadCss: Adds CSS file(s) to the page
     * @param {Array.<string>|string} url - url(s) for CSS files.
     */
    loadCss(url) {
      if (Array.isArray(url)) return recursiveLoad.call(this, url, this.loadCss);
      const findings = findResource(this.css, url);
      const css = findings === false ? addNewResource(this.css, url) : findings;
      if (css.state === 'fulfilled') {
        logMsg(`CSS ${url} already had been loaded.`);
        return Promise.resolve(css);
      }
      if (css.state === 'pending') return css.promise;
      css.promise = new Promise((resolve, reject) => {
        css.state = 'pending';
        loadCss(url)
          .then(() => {
            css.state = 'fulfilled';
            delete(css.promise);
            logMsg(`CSS ${url} has been loaded.`);
            resolve(css);
          }).catch((e) => {
            css.state = 'rejected';
            delete(css.promise);
            logMsg(e.message || e);
            reject(e);
          })
      });
      return css.promise;
    }

    /**
     * loadPlugin - loads plugin resources.
     * @param {Object} plugin - plugin description
     * @param {Array|string} plugin.js - Script source
     * @param {Array|string} plugin.css - CSS href
     * @returns {Promise}
     */
    loadPlugin(plugin) {
      return new Promise((resolve, reject) => {
        this.loadCss(plugin.css)
          .then(() => this.loadScript(plugin.js))
          .then(() => resolve())
          .catch(e => reject(e));
      });
    }

    constructor() {
      this.css = [];
      this.scripts = [];
    }
  }

  if (instance.RM && instance.RM instanceof RESOURCE_MANAGER) return;
  instance.RM = new RESOURCE_MANAGER();

  if (!document) return;
  document.addEventListener('DOMContentLoaded', () => {
    logMsg('Initializing Resource Manager...');
    // Initialize already added scripts.
    initResources('script', 'src', instance.RM.scripts);
    if (instance.RM.scripts.length) logMsg(`Found JS scripts: ${instance.RM.scripts.length}`);
    // Initialize already added CSS.
    initResources('link[type="text/css"]', 'href', instance.RM.css);
    if (instance.RM.css.length !== 0) logMsg(`Found CSS: ${instance.RM.css.length}`);
  });

})(window || global);
