require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Rule = require('./models/Rule');

const encode = (str) => Buffer.from(str).toString('base64');

const rules = [
  {
    ruleId: 'OPT-227927',
    name: 'OPT-227927 Gender Dropdown Remove',
    versions: [
      encode(`/* OPT-227927 START */
(() => {
    'use strict';

    const builderId = typeof arguments !== 'undefined' && arguments.length > 0
        ? arguments[0]
        : undefined;

    const variationId = Insider.campaign.userSegment.getActiveVariationByBuilderId(builderId);

    const registerForm = Insider.browser.isMobile()
        ? '.register_registerMobile__KHci2 form'
        : '.register_register__fjOVG form';

    if (variationId) {
        Insider.fns.onElementLoaded(registerForm, () => {
            Insider.campaign.custom.show(variationId);
        }).listen();
    }
})();
/* OPT-227927 END */`),
      encode(`/* OPT-227927 START */
(() => {
    'use strict';

    const getBuilderId = () => {
        if (typeof customRuleDetail !== 'undefined' && customRuleDetail?.builderId !== undefined) {
            return customRuleDetail.builderId;
        }

        if (typeof arguments !== 'undefined' && arguments.length > 0) {
            return arguments[0];
        }

        return undefined;
    };

    const builderId = getBuilderId();
    const variationId = Insider.campaign.userSegment.getActiveVariationByBuilderId(builderId);

    const { registerUrl, genderDropdown, registerForm } = {
        registerUrl: 'type=uye-ol',
        genderDropdown: '.register_registerFormGender__cptZ4',
        registerForm: Insider.browser.isMobile() ? '.register_registerMobile__KHci2 form' :
            '.register_register__fjOVG form',
    };

    if (Insider.campaign.get(variationId ?? 0)?.hus ?
        Insider.storage.get('ucd-segment-data')?.[builderId] : variationId) {
        if (Insider.fns.parseURL().rawHref.endsWith(registerUrl)) {
            Insider.fns.onElementLoaded(registerForm, () => {
                if (!Insider.campaign.isControlGroup(variationId)) {
                    Insider.dom(genderDropdown).remove();
                }

                Insider.campaign.custom.show(variationId);
            }).listen();
        }
    }
})();
/* OPT-227927 END */`),
    ],
  },
  {
    ruleId: 'OPT-198341',
    name: 'OPT-198341 Cart Upsell Banner',
    versions: [
      encode(`/* OPT-198341 START */
(() => {
    'use strict';

    const builderId = arguments[0];
    const variationId = Insider.campaign.userSegment.getActiveVariationByBuilderId(builderId);

    if (variationId) {
        Insider.fns.onElementLoaded('.cart-container', () => {
            Insider.campaign.custom.show(variationId);
        }).listen();
    }
})();
/* OPT-198341 END */`),
      encode(`/* OPT-198341 START */
(() => {
    'use strict';

    const builderId = arguments[0];
    const variationId = Insider.campaign.userSegment.getActiveVariationByBuilderId(builderId);
    const cartUrl = '/cart';

    if (variationId && window.location.pathname === cartUrl) {
        Insider.fns.onElementLoaded('.cart-container', () => {
            if (!Insider.campaign.isControlGroup(variationId)) {
                const banner = document.createElement('div');
                banner.className = 'insider-upsell-banner';
                banner.innerHTML = '<p>Complete your order for free shipping!</p>';
                document.querySelector('.cart-container').prepend(banner);
            }

            Insider.campaign.custom.show(variationId);
        }).listen();
    }
})();
/* OPT-198341 END */`),
      encode(`/* OPT-198341 START */
(() => {
    'use strict';

    const getBuilderId = () => {
        if (typeof customRuleDetail !== 'undefined' && customRuleDetail?.builderId !== undefined) {
            return customRuleDetail.builderId;
        }
        return typeof arguments !== 'undefined' ? arguments[0] : undefined;
    };

    const builderId = getBuilderId();
    const variationId = Insider.campaign.userSegment.getActiveVariationByBuilderId(builderId);
    const cartUrl = '/cart';
    const threshold = Insider.storage.get('upsell-threshold') ?? 500;

    if (variationId && window.location.pathname.includes(cartUrl)) {
        Insider.fns.onElementLoaded('.cart-container', () => {
            if (!Insider.campaign.isControlGroup(variationId)) {
                const cartTotal = parseFloat(document.querySelector('.cart-total')?.dataset?.value ?? 0);

                if (cartTotal < threshold) {
                    const banner = document.createElement('div');
                    banner.className = 'insider-upsell-banner';
                    banner.innerHTML = \`<p>Add \${threshold - cartTotal}₺ more for free shipping!</p>\`;
                    document.querySelector('.cart-container').prepend(banner);
                }
            }

            Insider.campaign.custom.show(variationId);
        }).listen();
    }
})();
/* OPT-198341 END */`),
    ],
  },
  {
    ruleId: 'OPT-215540',
    name: 'OPT-215540 PDP Size Guide Modal',
    versions: [
      encode(`/* OPT-215540 START */
(() => {
    'use strict';

    const builderId = arguments[0];
    const variationId = Insider.campaign.userSegment.getActiveVariationByBuilderId(builderId);

    if (variationId) {
        Insider.fns.onElementLoaded('.size-guide-btn', () => {
            Insider.campaign.custom.show(variationId);
        }).listen();
    }
})();
/* OPT-215540 END */`),
      encode(`/* OPT-215540 START */
(() => {
    'use strict';

    const getBuilderId = () => {
        if (typeof customRuleDetail !== 'undefined' && customRuleDetail?.builderId !== undefined) {
            return customRuleDetail.builderId;
        }
        return typeof arguments !== 'undefined' ? arguments[0] : undefined;
    };

    const builderId = getBuilderId();
    const variationId = Insider.campaign.userSegment.getActiveVariationByBuilderId(builderId);

    const { sizeGuideBtn, sizeGuideModal } = {
        sizeGuideBtn: '.pdp_sizeGuideButton__xK9p2',
        sizeGuideModal: '.pdp_sizeGuideModal__mN3k1',
    };

    if (Insider.campaign.get(variationId ?? 0)?.hus
        ? Insider.storage.get('ucd-segment-data')?.[builderId]
        : variationId) {
        Insider.fns.onElementLoaded(sizeGuideBtn, () => {
            if (!Insider.campaign.isControlGroup(variationId)) {
                Insider.dom(sizeGuideBtn).on('click', () => {
                    Insider.dom(sizeGuideModal).show();
                });
            }

            Insider.campaign.custom.show(variationId);
        }).listen();
    }
})();
/* OPT-215540 END */`),
    ],
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_CONNECTION_STRING);
  console.log('Connected to MongoDB');

  const user = await User.findById('69f5cb849db0c2fca7f663f8');
  if (!user) {
    console.error('User not found');
    process.exit(1);
  }
  console.log('Using user:', user.email);

  for (const data of rules) {
    await Rule.deleteOne({ userId: user._id, ruleId: data.ruleId });

    const now = new Date();
    const versions = data.versions.map((contentBase64, i) => ({
      contentBase64,
      createdAt: new Date(now.getTime() - (data.versions.length - 1 - i) * 24 * 60 * 60 * 1000),
    }));

    await Rule.create({ userId: user._id, ruleId: data.ruleId, name: data.name, versions });
    console.log(`Seeded: ${data.name} (${versions.length} versions)`);
  }

  console.log('\nDone. Seed user ID:', user._id.toString());
  await mongoose.disconnect();
}

seed().catch((err) => { console.error(err); process.exit(1); });
