/**
 * Share.js
 *
 * @author lynncho <admin@lynn.club>
 * @license MIT
 *
 * @example
 * <pre>
 * $('.share-components').share();
 *
 * // or
 *
 * $('.share-bar').share({
 *     sites: ['qzone', 'qq', 'weibo','wechat'],
 *     // ...
 * });
 * </pre>
 */

(function ($) {
    /**
     * Initialize a share bar.
     *
     * @param {Object}  $options globals (optional).
     */
    $.fn.share = function ($options) {
        var $image = $(document).find('img:first').prop('src');

        var $globals = {
            url: window.location.href,
            site_url: window.location.origin,
            source:
                $(document.head).find('[name="site"]').attr('content')
                || $(document.head).find('[name="Site"]').attr('content')
                || document.title,
            title:
                $(document.head).find('[name="title"]').attr('content')
                || $(document.head).find('[name="Title"]').attr('content')
                || document.title,
            description:
                $(document.head).find('[name="description"]').attr('content')
                || $(document.head).find('[name="Description"]').attr('content'),
            image: $image ? $image : '',
            wechatQrcodeTitle: '微信扫一扫',
            wechatQrcodeHelper: '<p>微信扫一扫，打开页面后，点击右上角分享。</p>',
            mobileSites: [
                'weibo',
                'qq',
                'qzone',
                'wechat',
                'timeline',
                'douban',
                'linkedin',
                'facebook',
                'twitter',
                'google'
            ],
            sites: [
                'weibo',
                'qq',
                'qzone',
                'wechat',
                'timeline',
                'douban',
                'linkedin',
                'facebook',
                'twitter',
                'google'
            ],
            disabled: [],
            initialized: false,
        };
        for (var attr in $options) {
            $globals[attr] = $options[attr];
        }

        var $apiTemplates = {
            qzone: 'https://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url={{URL}}&title={{TITLE}}&desc={{DESCRIPTION}}&summary={{SUMMARY}}&site={{SOURCE}}',
            qq: 'https://connect.qq.com/widget/shareqq/index.html?url={{URL}}&title={{TITLE}}&source={{SOURCE}}&desc={{DESCRIPTION}}',
            weibo: 'https://service.weibo.com/share/share.php?url={{URL}}&title={{TITLE}}&pic={{IMAGE}}',
            wechat: 'javascript:;',
            timeline: 'javascript:;',
            douban: 'https://www.douban.com/share/service?href={{URL}}&name={{TITLE}}&text={{DESCRIPTION}}&image={{IMAGE}}&starid=0&aid=0&style=11',
            linkedin: 'https://www.linkedin.com/shareArticle?mini=true&ro=true&title={{TITLE}}&url={{URL}}&summary={{SUMMARY}}&source={{SOURCE}}&armin=armin',
            facebook: 'https://www.facebook.com/sharer/sharer.php?u={{URL}}',
            twitter: 'https://twitter.com/intent/tweet?text={{TITLE}}&url={{URL}}&via={{SITE_URL}}',
            google: 'https://plus.google.com/share?url={{URL}}',
        };

        var isMobileScreen = $(window).width() < 768;

        this.each(function () {
            var $data = $.extend({}, $globals, $(this).data() || {});
            var $container = $(this).addClass('share-component').addClass('social-share');

            createIcons($container, $data);
            createWechat($container, $data);
        });

        /**
         * Create site icons
         *
         * @param {Object|String} $container
         * @param {Object}        $data
         */
        function createIcons($container, $data) {
            var $sites = getSites($data);

            for (var $i in $data.mode === 'prepend' ? $sites.reverse() : $sites) {
                var $name = $sites[$i];
                var $url = makeUrl($name, $data);

                var $link = $data.initialized ? $container.find('.icon-' + $name) : $('<a class="social-share-icon icon-' + $name + '" href="javascript:;" target="_self" onclick="shareCall(this, \'' + $name + '\')" data-url="' + $url + '"></a>');
                if (!$link.length) {
                    continue;
                }

                $link.data('url', $url);

                if (!$data.initialized) {
                    $data.mode === 'prepend' ? $container.prepend($link) : $container.append($link);
                }
            }
        }

        /**
         * Create the wechat icon and QRCode.
         *
         * @param {Object|String} $container
         * @param {Object}        $data
         */
        function createWechat($container, $data) {
            var $wechat = $container.find('a.icon-wechat');
            var $timeline = $container.find('a.icon-timeline');

            $wechat.append('<div class="wechat-qrcode"><h4>' + $data.wechatQrcodeTitle + '</h4><div class="qrcode"></div><div class="help">' + $data.wechatQrcodeHelper + '</div></div>');
            $wechat.find('.qrcode').qrcode({render: 'image', size: 100, text: $data.url});

            $timeline.append('<div class="wechat-qrcode"><h4>' + $data.wechatQrcodeTitle + '</h4><div class="qrcode"></div><div class="help">' + $data.wechatQrcodeHelper + '</div></div>');
            $timeline.find('.qrcode').qrcode({render: 'image', size: 100, text: $data.url});
        }

        /**
         * Get available site lists.
         *
         * @param {Array} $data
         *
         * @return {Array}
         */
        function getSites($data) {
            var $sites = isMobileScreen ? $data['mobileSites'] : $data['sites'];
            var $disabled = $data['disabled'];

            if (typeof $sites === 'string') {
                $sites = $sites.split(',')
            }
            if (typeof $disabled === 'string') {
                $disabled = $disabled.split(',')
            }

            if (isWeChat()) {
                $disabled.push('wechat');
                $disabled.push('timeline');
            }

            return $sites.filter(function (v) {
                return !($disabled.indexOf(v) > -1)
            });
        }

        /**
         * Build the url of icon.
         *
         * @param {String} $name
         * @param {Object} $data
         *
         * @return {String}
         */
        function makeUrl($name, $data) {
            var $template = $apiTemplates[$name];

            $data['summary'] = $data['description'];

            for (var $key in $data) {
                var $camelCaseKey = $name + $key.replace(/^[a-z]/, function ($str) {
                    return $str.toUpperCase();
                });

                var $value = encodeURIComponent($data[$camelCaseKey] || $data[$key]);
                $template = $template.replace(new RegExp('{{' + $key.toUpperCase() + '}}', 'g'), $value);
            }

            return $template;
        }

        /**
         * Detect wechat browser.
         *
         * @return {Boolean}
         */
        function isWeChat() {
            return navigator.userAgent.toLowerCase().indexOf('micromessenger') !== -1;
        }

        window.shareCall = function (element, command) {
            var url = $(element).data('url');

            if (isMobileScreen) {
                var callCommand = '';
                switch (command) {
                    case 'wechat':
                        $(element).removeClass('pc');
                        callCommand = 'wechatFriend';
                        break;
                    case 'timeline':
                        $(element).removeClass('pc');
                        callCommand = 'wechatTimeline';
                        break;
                    case 'weibo':
                        callCommand = 'weibo';
                        break;
                    case 'qq':
                        callCommand = 'qqFriend';
                        break;
                    case 'qzone':
                        callCommand = 'qZone';
                        break;
                    default:
                        // 如果不支持，在这里做降级处理
                        shareUrl(element, url);
                        break;
                }

                if (callCommand) {
                    try {
                        var shareData = {
                            title: $globals.title,
                            desc: $globals.description,
                            // 如果是微信该link的域名必须要在微信后台配置的安全域名之内的。
                            link: $globals.url,
                            icon: $globals.image
                        };

                        var nativeShare = new NativeShare();
                        nativeShare.call(callCommand, shareData);
                    } catch (err) {
                        alert(err.message);
                        // 如果不支持，在这里做降级处理
                        shareUrl(element, url);
                    }
                }
            } else {
                shareUrl(element, url);
            }
        };

        function shareUrl(element, url) {
            if (url === 'javascript:;') {
                $(element).removeClass('pc').addClass('pc');
            } else {
                window.open(url);
            }
        }
    };

    // Domready after initialization
    $(function () {
        $('.share-component,.social-share').share();
    });
})(jQuery);
