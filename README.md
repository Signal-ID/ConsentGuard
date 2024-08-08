# ConsentGuard

![ConsentGuard](https://www.heropixel.com/assets/consentguard-logo.png)

ConsentGuard is a lightweight, plug-and-play cookie consent banner designed to be easy to configure and compliant with major data protection regulations like GDPR and CCPA. 

## Features

- Easy integration and configuration
- Supports implicit and explicit consent
- Customizable colors to match your branding
- Compatible with Jitsu for tracking user preferences
- Essential scripts management
- Detailed documentation and examples

## Documentation

Comprehensive documentation for ConsentGuard is available at [Hero Pixel Docs](https://www.heropixel.com/docs/consentguard/consentguard-overview).

## Installation

### 1. Configure the Cookie Consent Options

Place your configuration options for the banner by defining the global `window.cookieConsentOptions` object:

```html
<script data-consent-category="essential">
    window.cookieConsentOptions = {
        privacy_policy_link: 'https://yourwebsite.com/privacy-policy',
        accept_color: '#28A745',
        nuetral_color: '#6c757d',
        preference_color: '#3482F3',
        background_color: '#f8f9fa'
    };
</script>
```

### 2. Include the Cookie Banner Script

Add the following script to your HTML file:

**Using CDN:**

```html
<script data-consent-category="essential" src="https://app.heropixel.com/consentguard_cookie_banner/index.js"></script>
```

**Using Local Hosting:**

Download the script from the repository and include it:

```html
<script data-consent-category="essential" src="/path/to/your/local/copy/index.js"></script>
```

## Consent Categories

### Example

```html
<!-- Original script tag -->
<script src="path/to/your/script.js"></script>

<!-- Updated script tag with consent category -->
<script data-consent-category="performance" src="path/to/your/script.js"></script>
```

### Categories

| Category      | Description                                             | Implicit for CCPA | Explicit for GDPR |
| ------------- | ------------------------------------------------------- | ----------------- | ----------------- |
| essential     | Essential for basic website functionality.              | Yes               | Yes               |
| performance   | Used for analytics and tracking site performance.       | Yes               | No                |
| functional    | Enable additional functionality like chat widgets or videos. | Yes               | No                |
| targeting     | Used for advertising and tracking user activity.        | Yes               | No                |
| social        | Enable social media sharing and interactions.           | Yes               | No                |

## Implicit and Explicit Consent Tags

### Implicit Consent

```html
<script-implicit data-consent-category="performance" src="path/to/analytics.js"></script-implicit>
```

### Explicit Consent

```html
<script-explicit data-consent-category="targeting" src="path/to/ad-tracking.js" async></script-explicit>
```

## Jitsu Integration

ConsentGuard supports integration with Jitsu for tracking user preferences. Sign up for a Jitsu cloud account and configure your `window.cookieConsentOptions` with your `writeKey` and `jitsuUrl`.

### Example

```html
<script data-consent-category="essential">
    window.cookieConsentOptions = {
        writeKey: 'YOUR_JITSU_WRITE_KEY',
        privacy_policy_link: 'https://yourwebsite.com/privacy-policy'
    };
</script>
<script data-consent-category="essential" src="https://app.heropixel.com/consentguard_cookie_banner/index.js"></script>
```

## Customizing Colors

You can customize the colors of the ConsentGuard banner to match your website's branding. Set the appropriate properties in the `window.cookieConsentOptions` object.

### Example

```html
<script data-consent-category="essential">
    window.cookieConsentOptions = {
        privacy_policy_link: 'https://yourwebsite.com/privacy-policy',
        accept_color: '#28A745',
        nuetral_color: '#6c757d',
        preference_color: '#3482F3',
        background_color: '#f8f9fa'
    };
</script>
```

## License

This project is licensed under the [License Name]. For more details, see the [LICENSE](https://github.com/Signal-ID/ConsentGuard/blob/main/LICENSE) file.

## Contributing

We welcome contributions! Please see our [CONTRIBUTING](https://github.com/Signal-ID/ConsentGuard/blob/main/CONTRIBUTING.md) guidelines for more details.

## Support

For support and issues, please contact the project maintainers or submit an issue on GitHub.

## Repository

You can find the repository at [GitHub - Signal-ID/ConsentGuard](https://github.com/Signal-ID/ConsentGuard).