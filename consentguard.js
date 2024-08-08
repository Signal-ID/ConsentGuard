(function() {
    class ConsentGuard {
        constructor() {
            // Default settings
            const defaults = {
                writeKey: '',
                jitsuUrl: false,
                privacyPolicyLink: '#',
                cookiePreferencesKey: 'cookie_preferences',
                acceptColor: '#28A745',
                nuetralColor: '#6c757d',
                preferenceColor: '#3482F3',
                backgroundColor: '#f8f9fa',
                userId: false
            };

            // Override defaults with user-defined options
            const options = window.cookieConsentOptions || {};
            Object.assign(this, defaults, options);

            // Initialize the Set in the constructor or class initialization
            this.scriptsSet = this.scriptsSet || new Set();
            this.callbacks = []; 

            // Map category names to their full names and descriptions
            this.categoryDescriptions = {
                essential: "Essential - Essential for basic website functionality.",
                performance: "Performance - Used for analytics and tracking site performance.",
                functional: "Functional - Enable additional functionality like chat widgets or videos.",
                targeting: "Targeting - Used for advertising and tracking user activity.",
                social: "Social Media - Enable social media sharing and interactions."
            };

            this.init();
            this.observeNewScripts();
            this.scanScriptsInDOM();
        }

        init() {
            this.debug('Initializing User Controls');
            if (this.isCookieAccepted()) {

            } else if (this.hasStoredPreferences()) {
                if (document.readyState === 'loading') {
                    // The document is still loading, so wait for it to finish
                    document.addEventListener('DOMContentLoaded', this.displayShield.bind(this));
                } else {
                    // The DOM has already loaded
                    this.displayShield();
                }
            } else if (!this.isCookieAccepted()) {
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', function(){
                        this.injectBanner();
                        this.addEventListeners();
                    }.bind(this));
                } else {
                    // The DOM has already loaded
                    this.injectBanner();
                    this.addEventListeners();
                }
            }
        }

        /********************************
         * 
         *        MANAGING THE COOKIE BANNER AND ACCEPT ALL
         * 
         *****************************/

        // Adding check for Global Privacy Control (GPC) and other opt-out signals
        isOptOutRequest() {
            return (
                navigator.globalPrivacyControl ||
                navigator.doNotTrack === '1' ||
                window.doNotTrack === '1' ||
                navigator.doNotTrack === 'yes'
            );
        }
        isCookieAccepted() {
            return document.cookie.split('; ').some((cookie) => cookie.startsWith('cookies_accepted=true'));
        }

        injectBanner() {
            this.debug('injectBanner');
            var bannerHTML = `
                <div id="cookie_banner_control_4512451245" style="position: fixed; bottom: 30px; left: 30px; right: 30px; height: 80px; background-color: ${this.backgroundColor}; color: #000000; display: flex; align-items: center; justify-content: space-between; padding:10px 50px 10px 50px; box-shadow: 0 34px 33px rgba(0, 0, 0, 0.3); z-index: 6000001; font-size: 14px; border: 1px solid #d4d4d4; margin: 0; font-family: Arial, sans-serif;">
                  <div style="flex-grow: 1; max-width: 70%; font-size: 14px; line-height: 1.5; color: #000000;">
                    <p style="margin: 0; padding: 0; font-size: 14px; line-height: 1.5; color: #000000;">
                      We use cookies to enhance your browsing experience. By continuing, you agree to our <a href="${this.privacyPolicyLink}" style="color: #007bff; text-decoration: none; font-size: 14px;">Cookie Policy</a>.
                    </p>
                  </div>
                  <div style="display: flex; gap: 10px;">
                    <button id="managePreferencesButton" style="background-color: ${this.nuetralColor}; color: white; border: none; padding: 10px 20px; cursor: pointer; border-radius: 4px; font-size: 14px; font-weight: 600; margin: 0;">Manage Preferences</button>
                    <button id="acceptAllButton" style="background-color: ${this.acceptColor}; color: white; border: none; padding: 10px 20px; cursor: pointer; border-radius: 4px; font-size: 14px; font-weight: 600; margin: 0;">Accept All</button>
                  </div>

                    <!-- Close Button -->
                    <div id="cookie_banner_close_icon_62353132451245" style="position: absolute;top: -8px;right: 6px;cursor: pointer;font-size: 31px;font-weight: normal;color: #999;">&times;</div>
                
                </div>`;
            bannerHTML = bannerHTML.replace(/\n\s*/g, '').trim();
            document.body.insertAdjacentHTML('beforeend', bannerHTML);

            document.getElementById('cookie_banner_close_icon_62353132451245').addEventListener('click', function() {
                document.getElementById('cookie_banner_control_4512451245').remove();
                this.displayShield();
            }.bind(this));
        }

        addEventListeners() {
            this.debug('addEventListeners');
            document.getElementById('acceptAllButton').addEventListener('click', this.acceptAllCookies.bind(this));
            document.getElementById('managePreferencesButton').addEventListener('click', this.showManagePreferences.bind(this));
        }

        acceptAllCookies() {
            this.debug('acceptAllCookies');

            const preferences = { accepted: true };
            this.saveAcceptPreference(preferences);
            this.sendPreferencesToJitsu(true);
            this.setCookie('cookies_accepted', 'true', 365);
            this.notifyCallbacks();
            this.removeBanner();
        }

        showManagePreferences() {
            this.debug('showManagePreferences');
            this.removeBanner();
            this.displayManagePreferences();
        }

        loadJitsu() {
            window.jitsuLoaded = function(jitsu) {
                this.debug('Jitsu has loaded');
            }.bind(this);

            return new Promise((resolve, reject) => {
                if (!window.jitsu && this.jitsuUrl) {
                    window.jitsuConfig = {
                        "writeKey": `"${this.writeKey}"`,
                        "initOnly": true,
                    }
                    const script = document.createElement('script');
                    if (this.userId) {
                        window.jitsuConfig['userId'] = `'${this.userId}'`;
                        script.setAttribute('data-user-id', this.userId);
                    }
                    script.setAttribute('data-consent-category', 'essential');
                    script.setAttribute('data-init-only', true);
                    script.src = this.jitsuUrl;
                    script.async = true;
                    script.onload = function() {
                        if (typeof window.jitsuLoaded === 'function') {
                            window.jitsuLoaded(window.jitsu);
                        }
                        resolve(); // Resolve the promise when the script is loaded
                    };
                    script.onerror = function() {
                        reject(new Error('Failed to load Jitsu script.'));
                    };
                    document.head.appendChild(script);
                } else {
                    resolve(); // Resolve immediately if Jitsu is already loaded
                }
            });
        }

        sendPreferencesToJitsu(acceptedAll) {
            this.debug('sendPreferencesToJitsu');
            this.loadJitsu().then(() => {
                try {
                    // Code to execute after Jitsu is loaded
                    let params = JSON.parse(localStorage.getItem(this.cookiePreferencesKey));
                    if (this.userId) {
                        params['userId'] = this.userId;
                    }
                    window.jitsu.track(acceptedAll ? 'accept_all' : 'accept_partial', params);
                } catch(e) {
                    this.debug('User consent was not saved', e);
                }
            }).catch(error => {
                console.error('Error loading cookie preferences communication server:', error);
            });
        }
        
        setCookie(name, value, days) {
            this.debug('setCookie');
            const expires = new Date(Date.now() + days * 864e5).toUTCString();
            document.cookie = `${name}=${value}; expires=${expires}; path=/`;
        }

        removeBanner() {
            this.debug('removeBanner');
            const banner = document.getElementById('cookie_banner_control_4512451245');
            if (banner) banner.remove();
        }

        /********************************
         * 
         *        MANAGING THE COOKIE PREFERENCES
         * 
         *****************************/

        saveAcceptPreference(preferences) {
            this.debug('saveAcceptPreference ', preferences);
            localStorage.setItem(this.cookiePreferencesKey, JSON.stringify(preferences));
        }

        loadCategoryPreferences() {
            // Load stored category preferences from localStorage
            const preferences = localStorage.getItem(this.cookiePreferencesKey);
            return preferences ? JSON.parse(preferences) : {};
        }
        
        saveCategoryPreferences(e) {
            this.debug('saveCategoryPreferences');
            const categoryPreferences = {};

            let acceptedAll = true;
            document.querySelectorAll('#domain-controls input[type="checkbox"]').forEach(checkbox => {
                categoryPreferences[checkbox.getAttribute('data-category')] = checkbox.checked;
                if (!checkbox.checked) {
                    acceptedAll = false;
                }
            });
            localStorage.setItem(this.cookiePreferencesKey, JSON.stringify(categoryPreferences));
        
            // Send preferences to Jitsu
            this.sendPreferencesToJitsu(acceptedAll);

            // Enable or disable scripts based on preferences
            this.notifyCallbacks();
        }

        // Helper method to check for stored cookie preferences
        hasStoredPreferences() {
            const preferences = localStorage.getItem(this.cookiePreferencesKey);
            return preferences !== null;
        }

        getOptedOutCategories() {
            // Load stored category preferences from localStorage
            const storedPreferences = this.loadCategoryPreferences();
            
            // Initialize an array to store opted-out categories
            const optedOutCategories = [];
            
            // Iterate over the stored preferences to find categories that are opted out
            for (const category in storedPreferences) {
                if (storedPreferences[category] === false) {
                    optedOutCategories.push(category);
                }
            }
            
            return optedOutCategories;
        }

        isUserConsentExplicit(category) {
            const savedPreferences = this.loadCategoryPreferences();
            const isAccepted = savedPreferences[category] !== undefined && savedPreferences[category] === true;
    
            // Check if user has accepted all cookies, has specific category preference, or if GPC/Do Not Track is not set
            return this.isCookieAccepted() || isAccepted || !this.isOptOutRequest();
        }

        isCategoryOptedOut(script) {
            // Get the category of the script
            const category = script.getAttribute('data-consent-category');
        
            // Honor user request to not track
            if (this.isOptOutRequest()) {
                if (category == 'targeting' || category == 'social') {
                    return true;
                }
            }

            // Retrieve the list of opted-out categories
            const optedOutCategories = this.getOptedOutCategories();

            // Check if the category is in the opted-out list
            return optedOutCategories.includes(category);
        }

        isCategoryEssential(script) {
            // Get the category of the script
            const category = script.getAttribute('data-consent-category');
            return category === 'essential';
        }

        /********************************
         * 
         *        MANAGING SCRIPT PREFERENCES
         * 
         *****************************/

        observeNewScripts() {
            this.info('Observing');

            // Create an observer instance linked to the callback function
            const observer = new MutationObserver((mutationsList) => {
                for (const mutation of mutationsList) {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach(node => {
                            if (node.tagName === 'SCRIPT') {
                                this.guardScript(node);
                            }
                        });
                    }
                }
            });

            // Start observing the documentElement for child list changes
            observer.observe(document.documentElement, { childList: true, subtree: true });
        }

        scanScriptsInDOM() {
            // Get all script elements in the document
            const allScripts = document.documentElement.querySelectorAll('script');
            
            allScripts.forEach(script => {
                // For example, adding the script to the array for further processing
                this.guardScript(script);
            });
        }

        guardScript(script) {
            if (!this.isCategoryEssential(script)) {
                if (!script.hasAttribute('data-consent-guard')) {
                    // only log when we are actually adding a script to ConsentGuard
                    this.warn('Script bypassing privacy controls', script);
                }
                
                // if the category has been opted out of then we block loading
                if (this.isCategoryOptedOut(script)) {
                    this.debug('User Opted Out - Attempting to Block - ', script.src);
                    // best practice
                    script.setAttribute('data-type-original', script.type);
                    script.type = "text/plain";
                    // straightforward
                    script.remove();

                }
            }

            if (!this.scriptsSet.has(script)) {
                this.scriptsSet.add(script);
            }
        }

        populateScriptCategories() {
        
            // Generate UI for category controls
            const categoryControls = document.getElementById('domain-controls');
            let categoryListHTML = `
                <ul style="font-weight: 300; color: rgb(38, 39, 44); line-height: 28px; padding-left: 0;">`;
        
            Object.keys(this.categoryDescriptions).forEach(category => {
                const description = this.categoryDescriptions[category] || "No description available.";
                const [title, desc] = description.split(' - ');
                const disabled = category === 'essential' ?'disabled':'';
                categoryListHTML += `
                    <li style="margin-bottom: 12px; position: relative; padding: 0 0 0 14px; max-width: 525px; text-align: left; list-style: none; font-size: 20px; font-family: geo-wf, Helvetica, Arial;">
                        <input ${disabled} type="checkbox" data-category="${category}" name="${category}" value="1" style="width: 25px; height: 25px; vertical-align: bottom; background-color: #222; border: none; border-radius: 3px; appearance: none; -webkit-appearance: none; -moz-appearance: none; position: relative; cursor: pointer;" class="custom-checkbox" checked>
                        <strong style="display: initial;">${title}</strong> - ${desc}
                    </li>`;
            });
        
            categoryListHTML += `</ul>
            <style>.custom-checkbox:checked::after {
                content: '';
                position: absolute;
                left: 8px;
                top: 4px;
                width: 5px;
                height: 12px;
                border: solid white;
                border-width: 0 3px 3px 0;
                transform: rotate(45deg);
            }</style>`;
            categoryControls.innerHTML = categoryListHTML;
        
            // Load preferences and update UI accordingly
            const storedPreferences = this.loadCategoryPreferences();
            document.querySelectorAll('#domain-controls input[type="checkbox"]').forEach(checkbox => {
                const category = checkbox.getAttribute('data-category');
                checkbox.checked = storedPreferences[category] !== false;
            });
        }

        /********************************
         * 
         *        DISPLAY MANAGE PREFERENCES
         * 
         *****************************/

        displayManagePreferences() {
            // Create and insert the Manage Preferences HTML
            var managePreferencesHTML = `
<article id="cookie_preferences_control_panel_124535624673145" role="main" style="overflow: auto;display: block;position: fixed;z-index: 9999999;top: 0;bottom: 0;left: 0;right: 0;height: 100vh;">
    <div style="text-align: center;background: ${this.backgroundColor};min-height: 100vh;">
      <div style="padding: 100px 100px 60px;">
        <div style="display: grid; grid-gap: 64px; align-items: flex-start; grid-template-columns: minmax(min-content, 1fr) minmax(min-content, 2fr);">
          <div id="book-a-call" style="background: #fff;padding: 36px 36px 56px;text-align: left;box-shadow: rgba(0, 0, 0, 0.07) 0px 12px 80px 0px;">
            <p style="font-size: 30px;line-height: 1.5;margin-bottom: 28px;font-family: geo-wf, Helvetica, Arial;color: rgb(38, 39, 44);">Cookie Restriction Preferences</p>

            <div id="wpcf7-f76387-p76388-o1" lang="en-US" dir="ltr">
              <form action="#" method="post" aria-label="Contact form" novalidate="novalidate" data-status="init">
                <div id="domain-controls">
                    <!-- Categories will be dynamically populated here -->
                </div>
                <input value="Save Preference Cookie" id="cookie_preferences_save_62353132451245" type="submit" style="margin-top:20px;font-size: 12px; line-height: 1.5em; padding: 21px 10px 19px; width: 100%; border: 1px solid ${this.preferenceColor}; border-radius: 2px; cursor: pointer; font-weight: 700; letter-spacing: .126em; display: inline-block; min-width: 140px; padding-left: 20px; padding-right: 20px; background-color: ${this.preferenceColor}; color: #fff; text-transform: uppercase;" />
              </form>
            </div>
          </div>
          <div>
            <p style="color: ${this.preferenceColor};font-size: 14px;font-weight: 500;letter-spacing: 2px;line-height: 1em;margin-bottom: 26px;text-align: left;text-transform: uppercase;font-family: geo-wf, Helvetica, Arial;">Manage Preferences</p>
            <p style="font-size: 44px; line-height: 1.22727; margin-bottom: 24px; text-align: left; font-family: geo-wf, Helvetica, Arial;">
                Your Preferences Will Be Saved Using an  
                <span style="color: ${this.preferenceColor};">Essential Cookie</span> 
            </p>
            <p style="text-align: left; font-size: 15px; font-family: geo-wf, Helvetica, Arial; font-weight: 300; color: rgb(38, 39, 44); line-height: 23px;">
                Customize your experience by managing your cookie and tracking preferences on this domain. We will set a cookie to remember your preferences for future visits, ensuring that your choices are respected and you have a personalized experience. Some cookies are necessary for this purpose and cannot be turned off.
            </p>
            <p style="text-align: left; font-size: 15px; font-family: geo-wf, Helvetica, Arial; font-weight: 300; color: rgb(38, 39, 44); line-height: 23px;">
                For more information on how we use cookies and how you can manage them, please see our <a href="${this.privacyPolicyLink}" style="color: #007bff; text-decoration: none;">Privacy Policy</a>.
            </p>

            <p style="text-align: left; font-size: 15px; font-family: geo-wf, Helvetica, Arial; font-weight: 300; color: rgb(38, 39, 44); line-height: 23px;">
            You can enable or disable the loading of certain functionality based on your preferences. Remember, necessary cookies are essential for the basic functionality of the site and cannot be disabled. However, you have full control over optional cookies and tracking.
            </p>
            <p style="font-size: 20px; font-family: geo-wf, Helvetica, Arial; font-weight: 600; color: rgb(38, 39, 44); line-height: 28px; text-align: left;">Optional Cookies and Tracking:</p>
            <ul style="font-weight: 300; color: rgb(38, 39, 44); line-height: 23px;">
                <li style="margin-bottom: 12px; position: relative; padding: 0 0 0 14px; max-width: 525px; text-align: left; list-style: none; font-size: 15px; font-family: geo-wf, Helvetica, Arial;">
                    <strong style="display: initial;">Necessary:</strong> – Essential for the website's basic functionality, such as security, network management, and accessibility. These cookies cannot be turned off.
                    <span style="background: ${this.preferenceColor}; border-radius: 50%;display: block;height: 10px;left: -5px;position: absolute;top: .5em;width: 10px;"></span>
                </li>
                <li style="margin-bottom: 12px; position: relative; padding: 0 0 0 14px; max-width: 525px; text-align: left; list-style: none; font-size: 15px; font-family: geo-wf, Helvetica, Arial;">
                    <strong style="display: initial;">Performance and Analytics:</strong> – These cookies collect information about how visitors use the website. They help us understand site usage and improve performance. They do not collect personal data.
                    <span style="background: ${this.preferenceColor}; border-radius: 50%;display: block;height: 10px;left: -5px;position: absolute;top: .5em;width: 10px;"></span>
                </li>
                <li style="margin-bottom: 12px; position: relative; padding: 0 0 0 14px; max-width: 525px; text-align: left; list-style: none; font-size: 15px; font-family: geo-wf, Helvetica, Arial;">
                    <strong style="display: initial;">Functional:</strong> – These cookies enable enhanced functionality and personalization, such as videos and live chats. If not enabled, some features may not function properly.
                    <span style="background: ${this.preferenceColor}; border-radius: 50%;display: block;height: 10px;left: -5px;position: absolute;top: .5em;width: 10px;"></span>
                </li>
                <li style="margin-bottom: 12px; position: relative; padding: 0 0 0 14px; max-width: 525px; text-align: left; list-style: none; font-size: 15px; font-family: geo-wf, Helvetica, Arial;">
                    <strong style="display: initial;">Targeting:</strong> – These cookies may be set through our site by our advertising partners. They are used to build a profile of your interests and show you relevant ads on other sites.
                    <span style="background: ${this.preferenceColor}; border-radius: 50%;display: block;height: 10px;left: -5px;position: absolute;top: .5em;width: 10px;"></span>
                </li>
                <li style="margin-bottom: 12px; position: relative; padding: 0 0 0 14px; max-width: 525px; text-align: left; list-style: none; font-size: 15px; font-family: geo-wf, Helvetica, Arial;">
                    <strong style="display: initial;">Social Media:</strong> – These cookies enable social media features, allowing you to share content with your network.
                    <span style="background: ${this.preferenceColor}; border-radius: 50%;display: block;height: 10px;left: -5px;position: absolute;top: .5em;width: 10px;"></span>
                </li>
            </ul>
          </div>
        </div>

        <!-- Close Button -->
        <div id="cookie_preferences_close_icon_62353132451245" style="position: absolute;top: 9px;right: 21px;cursor: pointer;font-size: 35px;font-weight: normal;color: #999;">&times;</div>
      
      </div>
    </div>
  </article>`;
            document.body.insertAdjacentHTML('beforeend', managePreferencesHTML);
            this.populateScriptCategories();

            document.getElementById('cookie_preferences_close_icon_62353132451245').addEventListener('click', function() {
                document.getElementById('cookie_preferences_control_panel_124535624673145').remove();
                this.displayShield();
            }.bind(this));

            document.getElementById('cookie_preferences_save_62353132451245').addEventListener('click', function(event) {
                event.preventDefault();
                document.getElementById('cookie_preferences_save_62353132451245').value = "Saving...";
                this.saveCategoryPreferences();

                document.getElementById('cookie_preferences_control_panel_124535624673145').remove();
                this.displayShield();
            }.bind(this));
        }

        displayShield() {
            const shield = `
            <a href="#" id="cookie_preferences_shield_3rgdfg134" style="align-items: center; background-color: ${this.backgroundColor}; border: 1px solid #e8e8e8; border-radius: 6px; box-shadow: 0 0 22px 0 rgba(224, 224, 224, 1); cursor: pointer; display: flex; flex-direction: column; height: 35px; justify-content: center; line-height: 18px; padding: 0; text-decoration: none; width: 35px; position: fixed; right: 10px; bottom: 49%; z-index: 9999999;">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" style="width: 70%;height: 70%;font-weight: normal;">
                    <g transform="scale(0.9, 0.9) translate(28, 28)">
                        <path d="M256 0c4.6 0 9.2 1 13.4 2.9L457.7 82.8c22 9.3 38.4 31 38.3 57.2c-.5 99.2-41.3 280.7-213.6 363.2c-16.7 8-36.1 8-52.8 0C57.3 420.7 16.5 239.2 16 140c-.1-26.2 16.3-47.9 38.3-57.2L242.7 2.9C246.8 1 251.4 0 256 0zm0 66.8l0 378.1C394 378 431.1 230.1 432 141.4L256 66.8s0 0 0 0z" fill="${this.nuetralColor}"></path>
                    </g>
                </svg>
            </a>`;
            document.body.insertAdjacentHTML('beforeend', shield);

            document.getElementById('cookie_preferences_shield_3rgdfg134').addEventListener('click', (event) => {
                event.preventDefault();
                this.displayManagePreferences();
                document.getElementById('cookie_preferences_shield_3rgdfg134').remove();
            });
        }

        registerCallback(callback) {
            if (typeof callback === 'function' && !this.callbacks.includes(callback)) {
                this.callbacks.push(callback);
            }
        }
    
        unregisterCallback(callback) {
            this.callbacks = this.callbacks.filter(cb => cb !== callback);
        }
    
        notifyCallbacks() {
            this.callbacks.forEach(callback => callback());
        }

        debug( ...args ) {
            if (!this.debug) {
                return;
            }
            console.log('ConsentGuard ', ...args);
        }

        error( ...args ) {
            console.error('ConsentGuard ', ...args);
        }
        warn( ...args ) {
            console.warn('ConsentGuard ', ...args);
        }
        info( ...args ) {
            console.info('ConsentGuard ', ...args);
        }
    } // end of ConsentGuard

    // Initialize the ConsentGuard class
    window.consent = new ConsentGuard();
    




    class ScriptImplicit extends HTMLElement {
        constructor() {
            super();
            this.scriptElement = null;
        }

        connectedCallback() {
            // Check the category and load the script if not opted out
            this.loadScript();
            this.style.display = 'none'; // Hide the content
        }

        loadScript() {
            let category;
            if (this.hasAttribute('data-consent-category')) {
                category = this.getAttribute('data-consent-category');
            } else {
                category = this.getAttribute('category');
            }
            
            if (!category) {
                window.consent.error('category attribute is required for <script-implicit>.');
                return;
            }

            // Check if the category is opted out
            if (window.consent.isCategoryOptedOut({ getAttribute: () => category })) {
                window.consent.info(`User Opted Out of ${category} - Blocking`, this);
                return;
            }

            // Create a regular script element and transfer attributes
            this.scriptElement = document.createElement('script');
            for (let i = 0; i < this.attributes.length; i++) {
                const attr = this.attributes[i];
                if (attr.name !== 'is' && (attr.name !== 'category' || attr.name !== 'data-consent-category')) {
                    this.scriptElement.setAttribute(attr.name, attr.value);
                }
            }

            if (this.src) {
                // If the script has a src attribute, set the src
                this.scriptElement.src = this.src;
            } else {
                // If the script is inline, set its content
                this.scriptElement.textContent = this.textContent;
            }

            this.scriptElement.setAttribute('data-consent-category', category);
            this.scriptElement.setAttribute('data-consent-guard', true);
            window.consent.guardScript(this.scriptElement);

            // Replace the custom element with the new script element
            this.replaceWith(this.scriptElement);
        }
    }

    // Define the custom element
    customElements.define('script-implicit', ScriptImplicit);





    class ScriptExplicit extends HTMLElement {
        constructor() {
            super();
            this.handleConsentChange = this.handleConsentChange.bind(this);
        }
    
        connectedCallback() {
            this.style.display = 'none'; // Hide the content

            // Check consent status when the element is attached to the DOM
            this.checkConsent();
    
            // Register the callback to be notified when the user's consent preferences change
            window.consent.registerCallback(this.handleConsentChange);
        }
    
        disconnectedCallback() {
            // Cleanup: Remove the callback registration when the element is detached
            window.consent.unregisterCallback(this.handleConsentChange);
        }
    
        handleConsentChange() {
            // Re-check consent status when the user's preferences change
            this.checkConsent();
        }
        
        checkConsent() {
            let category;
            if (this.hasAttribute('data-consent-category')) {
                category = this.getAttribute('data-consent-category');
            } else {
                category = this.getAttribute('category');
            }

            if (!window.consent.isUserConsentExplicit()) {
                // User has not given explicit consent
                window.consent.info(`Explicit consent not given. Script blocked: ${category}.`);
                return;
            }

            if (window.consent.isCategoryOptedOut({ getAttribute: () => category })) {
                // Category is opted out, don't load the script
                window.consent.info(`User opted out of category: ${category}. Script blocked.`);
            } else {
                // Load the script
                this.loadScript(category);
            }
        }
    
        loadScript(category) {
            // Create a new script element
            const script = document.createElement('script');
            for (let i = 0; i < this.attributes.length; i++) {
                const attr = this.attributes[i];
                if (attr.name !== 'is' && (attr.name !== 'category' || attr.name !== 'data-consent-category')) {
                    script.setAttribute(attr.name, attr.value);
                }
            }
    
            // If the script has inner content
            if (this.innerHTML) {
                script.textContent = this.innerHTML;
            }
    
            script.setAttribute('data-consent-category', category);
            script.setAttribute('data-consent-guard', true);
            window.consent.guardScript(script);

            this.replaceWith(script);
        }
    }
    
    // Define the new custom element
    customElements.define('script-explicit', ScriptExplicit);
    
})();
