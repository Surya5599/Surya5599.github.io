(function(e) {
    function t(t) {
        for (var r, i, c = t[0], s = t[1], u = t[2], d = 0, l = []; d < c.length; d++) i = c[d], Object.prototype.hasOwnProperty.call(o, i) && o[i] && l.push(o[i][0]), o[i] = 0;
        for (r in s) Object.prototype.hasOwnProperty.call(s, r) && (e[r] = s[r]);
        p && p(t);
        while (l.length) l.shift()();
        return a.push.apply(a, u || []), n()
    }

    function n() {
        for (var e, t = 0; t < a.length; t++) {
            for (var n = a[t], r = !0, i = 1; i < n.length; i++) {
                var c = n[i];
                0 !== o[c] && (r = !1)
            }
            r && (a.splice(t--, 1), e = s(s.s = n[0]))
        }
        return e
    }
    var r = {},
        i = {
            game_activity: 0
        },
        o = {
            game_activity: 0
        },
        a = [];

    function c(e) {
        return s.p + "js/" + ({} [e] || e) + ".0e658ed7be0fcb6884a3.js"
    }

    function s(t) {
        if (r[t]) return r[t].exports;
        var n = r[t] = {
            i: t,
            l: !1,
            exports: {}
        };
        return e[t].call(n.exports, n, n.exports, s), n.l = !0, n.exports
    }
    s.e = function(e) {
        var t = [],
            n = {
                "chunk-50221802": 1,
                "chunk-216e304e": 1,
                "chunk-876c1fe8": 1,
                "chunk-7dcd610c": 1,
                "chunk-ea3be212": 1,
                "chunk-082bbcde": 1,
                "chunk-3dd29f12": 1,
                "chunk-62afee8c": 1,
                "chunk-4171fd9a": 1,
                "chunk-b3bb7e3c": 1,
                "chunk-2332c6d9": 1,
                "chunk-1d7d5fb8": 1,
                "chunk-4f68d59c": 1
            };
        i[e] ? t.push(i[e]) : 0 !== i[e] && n[e] && t.push(i[e] = new Promise((function(t, n) {
            for (var r = "css/" + ({} [e] || e) + "." + {
                    "chunk-50221802": "6d1ea7e3",
                    "chunk-63cbed10": "31d6cfe0",
                    "chunk-216e304e": "4a0fe4fb",
                    "chunk-876c1fe8": "979858c3",
                    "chunk-7dcd610c": "74efacb1",
                    "chunk-ea3be212": "59757856",
                    "chunk-082bbcde": "50f91e6c",
                    "chunk-3dd29f12": "281f2807",
                    "chunk-62afee8c": "0cc4e76f",
                    "chunk-4171fd9a": "c0267437",
                    "chunk-b3bb7e3c": "c947fef0",
                    "chunk-2332c6d9": "1fefb2e7",
                    "chunk-1d7d5fb8": "c0acc987",
                    "chunk-4f68d59c": "5ff0508b"
                } [e] + ".css", o = s.p + r, a = document.getElementsByTagName("link"), c = 0; c < a.length; c++) {
                var u = a[c],
                    d = u.getAttribute("data-href") || u.getAttribute("href");
                if ("stylesheet" === u.rel && (d === r || d === o)) return t()
            }
            var l = document.getElementsByTagName("style");
            for (c = 0; c < l.length; c++) {
                u = l[c], d = u.getAttribute("data-href");
                if (d === r || d === o) return t()
            }
            var p = document.createElement("link");
            p.rel = "stylesheet", p.type = "text/css", p.onload = t, p.onerror = function(t) {
                var r = t && t.target && t.target.src || o,
                    a = new Error("Loading CSS chunk " + e + " failed.\n(" + r + ")");
                a.code = "CSS_CHUNK_LOAD_FAILED", a.request = r, delete i[e], p.parentNode.removeChild(p), n(a)
            }, p.href = o;
            var f = document.getElementsByTagName("head")[0];
            f.appendChild(p)
        })).then((function() {
            i[e] = 0
        })));
        var r = o[e];
        if (0 !== r)
            if (r) t.push(r[2]);
            else {
                var a = new Promise((function(t, n) {
                    r = o[e] = [t, n]
                }));
                t.push(r[2] = a);
                var u, d = document.createElement("script");
                d.charset = "utf-8", d.timeout = 120, s.nc && d.setAttribute("nonce", s.nc), d.src = c(e);
                var l = new Error;
                u = function(t) {
                    d.onerror = d.onload = null, clearTimeout(p);
                    var n = o[e];
                    if (0 !== n) {
                        if (n) {
                            var r = t && ("load" === t.type ? "missing" : t.type),
                                i = t && t.target && t.target.src;
                            l.message = "Loading chunk " + e + " failed.\n(" + r + ": " + i + ")", l.name = "ChunkLoadError", l.type = r, l.request = i, n[1](l)
                        }
                        o[e] = void 0
                    }
                };
                var p = setTimeout((function() {
                    u({
                        type: "timeout",
                        target: d
                    })
                }), 12e4);
                d.onerror = d.onload = u, document.head.appendChild(d)
            } return Promise.all(t)
    }, s.m = e, s.c = r, s.d = function(e, t, n) {
        s.o(e, t) || Object.defineProperty(e, t, {
            enumerable: !0,
            get: n
        })
    }, s.r = function(e) {
        "undefined" !== typeof Symbol && Symbol.toStringTag && Object.defineProperty(e, Symbol.toStringTag, {
            value: "Module"
        }), Object.defineProperty(e, "__esModule", {
            value: !0
        })
    }, s.t = function(e, t) {
        if (1 & t && (e = s(e)), 8 & t) return e;
        if (4 & t && "object" === typeof e && e && e.__esModule) return e;
        var n = Object.create(null);
        if (s.r(n), Object.defineProperty(n, "default", {
                enumerable: !0,
                value: e
            }), 2 & t && "string" != typeof e)
            for (var r in e) s.d(n, r, function(t) {
                return e[t]
            }.bind(null, r));
        return n
    }, s.n = function(e) {
        var t = e && e.__esModule ? function() {
            return e["default"]
        } : function() {
            return e
        };
        return s.d(t, "a", t), t
    }, s.o = function(e, t) {
        return Object.prototype.hasOwnProperty.call(e, t)
    }, s.p = "//statich5.cheapmessageapp.com/h5/dingtone/", s.oe = function(e) {
        throw console.error(e), e
    };
    var u = window["webpackJsonp"] = window["webpackJsonp"] || [],
        d = u.push.bind(u);
    u.push = t, u = u.slice();
    for (var l = 0; l < u.length; l++) t(u[l]);
    var p = d;
    a.push([0, "chunk-vendors"]), n()
})({
    0: function(e, t, n) {
        e.exports = n("4976")
    },
    "0503": function(e, t, n) {
        e.exports = n.p + "media/game_failure.bd75d696.mp3"
    },
    "234a": function(e, t, n) {
        e.exports = n.p + "media/begin.126bbaa0.mp3"
    },
    "30d6": function(e, t, n) {
        e.exports = n.p + "media/open.a29036a0.mp3"
    },
    "41cf": function(e, t, n) {
        e.exports = n.p + "media/countdown.b4a82523.mp3"
    },
    4976: function(e, t, n) {
        "use strict";
        n.r(t);
        var r = {};
        n.r(r), n.d(r, "default", (function() {
            return F
        }));
        n("cadf"), n("551c"), n("f751"), n("097d");
        var i = n("2b0e"),
            o = (n("f5df"), n("b20f"), function() {
                var e = this,
                    t = e.$createElement,
                    r = e._self._c || t;
                return r("div", {
                    attrs: {
                        id: "app"
                    }
                }, [r("router-view"), r("audio", {
                    ref: "begin",
                    attrs: {
                        id: "myAudio"
                    }
                }, [r("source", {
                    attrs: {
                        src: n("234a"),
                        type: "audio/mpeg"
                    }
                })]), r("audio", {
                    ref: "countdown",
                    attrs: {
                        id: "myAudio"
                    }
                }, [r("source", {
                    attrs: {
                        src: n("41cf"),
                        type: "audio/mpeg"
                    }
                })]), r("audio", {
                    ref: "game_failure",
                    attrs: {
                        id: "myAudio"
                    }
                }, [r("source", {
                    attrs: {
                        src: n("0503"),
                        type: "audio/mpeg"
                    }
                })]), r("audio", {
                    ref: "answer_correct",
                    attrs: {
                        id: "myAudio"
                    }
                }, [r("source", {
                    attrs: {
                        src: n("5262"),
                        type: "audio/mpeg"
                    }
                })]), r("audio", {
                    ref: "game_success",
                    attrs: {
                        id: "myAudio"
                    }
                }, [r("source", {
                    attrs: {
                        src: n("7f3f"),
                        type: "audio/mpeg"
                    }
                })]), r("audio", {
                    ref: "open",
                    attrs: {
                        id: "myAudio"
                    }
                }, [r("source", {
                    attrs: {
                        src: n("30d6"),
                        type: "audio/mpeg"
                    }
                })]), r("audio", {
                    ref: "bgm",
                    attrs: {
                        id: "myAudio",
                        loop: "loop"
                    }
                }, [r("source", {
                    attrs: {
                        src: n("8c27"),
                        type: "audio/mpeg"
                    }
                })])], 1)
            }),
            a = [],
            c = {
                name: "App",
                data: function() {
                    return {}
                },
                mounted: function() {
                    if (console.log("当前版本20191129,广告单例覆盖", "production", window.screen.width, window.screen.height), document.body.addEventListener("click", this.playMusic), localStorage.getItem("clientUserInfo")) {
                        var e = JSON.parse(localStorage.getItem("clientUserInfo"));
                        this.$store.commit("TOGGLE_USERINFO", e)
                    }
                },
                methods: {
                    playMusic: function() {
                        document.body.removeEventListener("click", this.playMusic), this.beginMusic(), this.$refs.begin.pause(), this.countdownMusic(), this.$refs.countdown.pause(), this.answerCorrectMusic(), this.$refs.answer_correct.pause(), this.gameFailureMusic(), this.$refs.game_failure.pause(), this.gameSuccessMusic(), this.$refs.game_success.pause(), this.openMusic(), this.$refs.open.pause(), this.bgmMusic(), this.$refs.bgm.pause()
                    },
                    pauseMusic: function() {
                        this.$refs.begin.pause(), this.$refs.countdown.pause(), this.$refs.answer_correct.pause(), this.$refs.game_failure.pause(), this.$refs.game_success.pause(), this.$refs.open.pause(), this.$refs.bgm.pause()
                    },
                    pauseBgmMusic: function() {
                        this.$refs.bgm.pause()
                    },
                    beginMusic: function() {
                        this.$refs.begin.play()
                    },
                    countdownMusic: function() {
                        this.$refs.countdown.play()
                    },
                    answerCorrectMusic: function() {
                        this.$refs.answer_correct.play()
                    },
                    gameFailureMusic: function() {
                        this.$refs.game_failure.play()
                    },
                    gameSuccessMusic: function() {
                        this.$refs.game_success.play()
                    },
                    openMusic: function() {
                        this.$refs.open.play()
                    },
                    bgmMusic: function() {
                        this.$refs.bgm.play()
                    }
                },
                provide: function() {
                    return {
                        beginMusic: this.beginMusic,
                        countdownMusic: this.countdownMusic,
                        answerCorrectMusic: this.answerCorrectMusic,
                        gameFailureMusic: this.gameFailureMusic,
                        gameSuccessMusic: this.gameSuccessMusic,
                        openMusic: this.openMusic,
                        pauseMusic: this.pauseMusic,
                        bgmMusic: this.bgmMusic,
                        pauseBgmMusic: this.pauseBgmMusic
                    }
                }
            },
            s = c,
            u = (n("fe2f"), n("2877")),
            d = Object(u["a"])(s, o, a, !1, null, null, null),
            l = d.exports,
            p = n("8c4f"),
            f = n("0284"),
            m = n.n(f);
        i["a"].use(p["a"]), i["a"].use(m.a, {
            id: ["UA-29757841-1", "UA-96358692-1"]
        });
        var g = new p["a"]({
            routes: [{
                path: "/",
                name: "index",
                meta: {
                    title: "Games for 100 Credits"
                },
                component: function() {
                    return Promise.all([n.e("chunk-ea3be212"), n.e("chunk-63cbed10"), n.e("chunk-4171fd9a")]).then(n.bind(null, "4948"))
                }
            }, {
                path: "/how-to-play",
                name: "how-to-play",
                meta: {
                    title: "Games for 100 Credits"
                },
                component: function() {
                    return n.e("chunk-50221802").then(n.bind(null, "036c"))
                }
            }, {
                path: "/gold-record",
                name: "gold-record",
                meta: {
                    title: "Coin History"
                },
                component: function() {
                    return Promise.all([n.e("chunk-63cbed10"), n.e("chunk-876c1fe8")]).then(n.bind(null, "bb77"))
                }
            }, {
                path: "/share",
                name: "share",
                meta: {
                    title: "Get 100+ free calling minutes!"
                },
                component: function() {
                    return Promise.all([n.e("chunk-63cbed10"), n.e("chunk-216e304e")]).then(n.bind(null, "f024"))
                }
            }, {
                path: "/withdraw",
                name: "withdraw",
                meta: {
                    title: "Reedem Credits"
                },
                component: function() {
                    return Promise.all([n.e("chunk-ea3be212"), n.e("chunk-63cbed10"), n.e("chunk-b3bb7e3c")]).then(n.bind(null, "c321"))
                }
            }, {
                path: "/play",
                name: "play",
                meta: {
                    title: "Games for 100 Credits"
                },
                component: function() {
                    return Promise.all([n.e("chunk-ea3be212"), n.e("chunk-082bbcde")]).then(n.bind(null, "8e0a"))
                }
            }, {
                path: "/out-play",
                name: "outplay",
                meta: {
                    title: "Games for 100 Credits"
                },
                component: function() {
                    return Promise.all([n.e("chunk-ea3be212"), n.e("chunk-3dd29f12")]).then(n.bind(null, "ce6b"))
                }
            }, {
                path: "/rank",
                name: "rank",
                meta: {
                    title: "Challenge Mode Ranklist"
                },
                component: function() {
                    return Promise.all([n.e("chunk-ea3be212"), n.e("chunk-62afee8c")]).then(n.bind(null, "19b1"))
                }
            }, {
                path: "/invite",
                name: "invite",
                meta: {
                    title: "Reward record"
                },
                component: function() {
                    return n.e("chunk-7dcd610c").then(n.bind(null, "d0f7"))
                }
            }]
        });

        function h(e) {
            if (window.WebViewJavascriptBridge) return e(window.WebViewJavascriptBridge);
            if (window.WVJBCallbacks) return window.WVJBCallbacks.push(e);
            window.WVJBCallbacks = [e];
            var t = document.createElement("iframe");
            t.style.display = "none", t.src = "https://__bridge_loaded__", document.documentElement.appendChild(t), setTimeout((function() {
                document.documentElement.removeChild(t)
            }), 0)
        }

        function b(e, t) {
            h((function(n) {
                n.registerHandler(e, (function(e, n) {
                    t(e, n)
                }))
            }))
        }
        n("a481"), n("4917");
        var y = n("7618");

        function v(e) {
            return null != e && "object" === Object(y["a"])(e)
        }

        function w(e, t) {
            return Object.prototype.hasOwnProperty.call(e, t)
        }
        var S, T = i["a"].extend(n("c9b6").default),
            k = function() {
                var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
                if (!i["a"].prototype.$isServer && v(e)) {
                    for (var t = ["toastMsg"], n = 0, r = t.length; n < r; n++)
                        if (!w(e, t[n])) throw Error("Missed required prop:".concat(t[n]));
                    return S = new T({
                        data: e
                    }), S = S.$mount(), document.body.appendChild(S.$el), S
                }
            };
        i["a"].prototype.$toast = function(e) {
            return k(e)
        };
        var _ = k,
            I = n("5375");
        n("a07f"), n("4ee2");
        ! function(e, t) {
            function n() {
                var t = o.getBoundingClientRect().width;
                t / s > 540 && (t = 540 * s);
                var n = t / 10;
                o.style.fontSize = n + "px", d.rem = e.rem = n
            }
            var r, i = e.document,
                o = i.documentElement,
                a = i.querySelector('meta[name="viewport"]'),
                c = i.querySelector('meta[name="flexible"]'),
                s = 0,
                u = 0,
                d = t.flexible || (t.flexible = {});
            if (a) {
                console.warn("将根据已有的meta标签来设置缩放比例");
                var l = a.getAttribute("content").match(/initial\-scale=([\d\.]+)/);
                l && (u = parseFloat(l[1]), s = parseInt(1 / u))
            } else if (c) {
                var p = c.getAttribute("content");
                if (p) {
                    var f = p.match(/initial\-dpr=([\d\.]+)/),
                        m = p.match(/maximum\-dpr=([\d\.]+)/);
                    f && (s = parseFloat(f[1]), u = parseFloat((1 / s).toFixed(2))), m && (s = parseFloat(m[1]), u = parseFloat((1 / s).toFixed(2)))
                }
            }
            if (!s && !u) {
                var g = e.navigator.appVersion.match(/android/gi),
                    h = e.chrome,
                    b = e.navigator.appVersion.match(/iphone|ipad/gi),
                    y = e.devicePixelRatio,
                    v = (g || b) && h;
                s = b || v ? y >= 3 && (!s || s >= 3) ? 3 : y >= 2 && (!s || s >= 2) ? 2 : 1 : 1, u = 1 / s
            }
            if (o.setAttribute("data-dpr", s), !a)
                if (a = i.createElement("meta"), a.setAttribute("name", "viewport"), a.setAttribute("content", "initial-scale=" + u + ", maximum-scale=" + u + ", minimum-scale=" + u + ", user-scalable=no"), o.firstElementChild) o.firstElementChild.appendChild(a);
                else {
                    var w = i.createElement("div");
                    w.appendChild(a), i.write(w.innerHTML)
                } e.addEventListener("resize", (function() {
                clearTimeout(r), r = setTimeout(n, 300)
            }), !1), e.addEventListener("pageshow", (function(e) {
                e.persisted && (clearTimeout(r), r = setTimeout(n, 300))
            }), !1), "complete" === i.readyState ? i.body.style.fontSize = 12 * s + "px" : i.addEventListener("DOMContentLoaded", (function(e) {
                i.body.style.fontSize = 12 * s + "px"
            }), !1), n(), d.dpr = e.dpr = s, d.refreshRem = n, d.rem2px = function(e) {
                var t = parseFloat(e) * this.rem;
                return "string" == typeof e && e.match(/rem$/) && (t += "px"), t
            }, d.px2rem = function(e) {
                var t = parseFloat(e) / this.rem;
                return "string" == typeof e && e.match(/px$/) && (t += "rem"), t
            }
        }(window, window.lib || (window.lib = {}));
        n("9810");
        console.log("全局---------", "production");
        var C, O, P = {
                campaignId: 10078,
                adId_double: 46,
                adId_continue: 47,
                adId_native: 48,
                adId_covert: 49,
                adId_addChance: 50,
                adId_revive: 51,
                content: "Hey friend. I'm playing a game to win 100+ free calling minutes! You can join me, too!",
                campaignName: "gameactivity",
                shareNumber: 1e3,
                shareNumber_invite: 1001
            },
            J = {
                game_activity: P
            },
            E = J,
            $ = Object(u["a"])(E, C, O, !1, null, null, null),
            j = $.exports,
            A = (n("8e6e"), n("456d"), n("7f7f"), n("ac6a"), n("bd86")),
            M = (n("28a5"), {}),
            D = navigator.userAgent,
            B = D.match(/(Android);?[\s\/]+([\d.]+)?/),
            x = D.match(/(iPad).*OS\s([\d_]+)/),
            N = D.match(/(iPod)(.*OS\s([\d_]+))?/),
            L = !x && D.match(/(iPhone\sOS)\s([\d_]+)/);
        M.ios = M.android = M.iphone = M.ipad = M.androidChrome = !1, B && (M.os = "android", M.osVersion = B[2], M.android = !0, M.androidChrome = D.toLowerCase().indexOf("chrome") >= 0), (x || L || N) && (M.os = "ios", M.ios = !0), L && !N && (M.osVersion = L[2].replace(/_/g, "."), M.iphone = !0), x && (M.osVersion = x[2].replace(/_/g, "."), M.ipad = !0), N && (M.osVersion = N[3] ? N[3].replace(/_/g, ".") : null, M.iphone = !0), M.ios && M.osVersion && D.indexOf("Version/") >= 0 && "10" === M.osVersion.split(".")[0] && (M.osVersion = D.toLowerCase().split("version/")[1].split(" ")[0]), M.webView = (L || x || N) && D.match(/.*AppleWebKit(?!.*Safari)/i), M.isWeixin = /MicroMessenger/i.test(D);
        var V = M,
            F = {
                DTJSInteractionTypeUnKnown: 0,
                DTJSInteractionTypeUserInfo: 100,
                DTJSInteractionTypeClientInfo: 101,
                DTJSInteractionTypeSetAccount: 1e3,
                DTJSInteractionTypeBindingNumber: 1001,
                DTJSInteractionTypeBindingMail: 1002,
                DTJSInteractionTypeProfile: 1003,
                DTJSInteractionTypeAddFriend: 1004,
                DTJSInteractionTypeFeedback: 1005,
                DTJSInteractionTypeContacts: 1006,
                DTJSInteractionTypeSendMsg: 1007,
                DTJSInteractionTypeSelectNumber: 1100,
                DTJSInteractionTypeSelectUSNumber: 1101,
                DTJSInteractionTypeBuyCredit: 1200,
                DTJSInteractionTypeFreeCredit: 1300,
                DTJSInteractionTypeLotteryTicket: 1400,
                DTJSInteractionTypeWalletInvite: 1500,
                DTJSInteractionTypeWalletPrivilege: 1501,
                DTJSInteractionTypeWalletTask: 1502,
                DTJSInteractionTypeSMS: 1600,
                DTJSInteractionTypeKeypad: 1700,
                DTJSInteractionTypeSecretary: 1800,
                DTJSInteractionTypeWebView: 1900,
                DTJSInteractionTypeShareAll: 5e3,
                DTJSInteractionTypeShareWhatsapp: 5001,
                DTJSInteractionTypeShareFacebook: 5002,
                DTJSInteractionTypeShareTwitter: 5003,
                DTJSInteractionTypeShareWechat: 5004,
                DTJSInteractionTypeBugCreditAlert: 5100,
                DTJSInteractionTypeInterstitialAd: 5400,
                DTJSInteractionTypeVideoAd: 5401,
                DTJSInteractionTypeFullNativeAd: 5402,
                DTJSInteractionTypeOfferAd: 5403,
                DTJSInteractionTypeLocalPush: 5500
            };

        function H(e, t) {
            var n = Object.keys(e);
            if (Object.getOwnPropertySymbols) {
                var r = Object.getOwnPropertySymbols(e);
                t && (r = r.filter((function(t) {
                    return Object.getOwnPropertyDescriptor(e, t).enumerable
                }))), n.push.apply(n, r)
            }
            return n
        }

        function U(e) {
            for (var t = 1; t < arguments.length; t++) {
                var n = null != arguments[t] ? arguments[t] : {};
                t % 2 ? H(Object(n), !0).forEach((function(t) {
                    Object(A["a"])(e, t, n[t])
                })) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : H(Object(n)).forEach((function(t) {
                    Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t))
                }))
            }
            return e
        }

        function R(e) {
            if (window.WebViewJavascriptBridge) return e(window.WebViewJavascriptBridge);
            document.addEventListener("WebViewJavascriptBridgeReady", (function(t) {
                return e(window.WebViewJavascriptBridge)
            }), !1)
        }

        function W(e) {
            if (window.WebViewJavascriptBridge) return e(window.WebViewJavascriptBridge);
            if (window.WVJBCallbacks) return window.WVJBCallbacks.push(e);
            window.WVJBCallbacks = [e];
            var t = document.createElement("iframe");
            t.style.display = "none", t.src = "https://__bridge_loaded__", document.documentElement.appendChild(t), setTimeout((function() {
                document.documentElement.removeChild(t)
            }), 0)
        }
        document.addEventListener("WebViewJavascriptBridgeReady", (function(e) {
            console.log("WebViewJavascriptBridgeReady")
        }));
        var z = function(e) {
                return function(t) {
                    var n = t._fetchQueue,
                        r = t._handleMessageFromNative,
                        i = t.registerHandler,
                        o = t.send,
                        a = t.superCallHandler,
                        c = t.callHandler;
                    t.init;
                    e.prototype.$jsBridge = U({}, e.prototype.$jsBridge, {
                        _fetchQueue: n,
                        callHandler: c,
                        registerHandler: i,
                        send: o,
                        superCallHandler: a,
                        _handleMessageFromNative: r
                    }), e.prototype.$jsBridge.callHandler = function(e, t, n) {
                        c("AppBridgeSuperFn", encodeURIComponent(JSON.stringify({
                            type: e,
                            params: t
                        })), (function(e) {
                            try {
                                n(JSON.parse(decodeURIComponent(e)))
                            } catch (t) {
                                n({
                                    code: 500,
                                    msg: "返回结果非标准JSONString",
                                    data: e
                                })
                            }
                        }))
                    }, G.forEach((function(t, n) {
                        e.prototype.$jsBridge.callHandler(t.name, t.params, t.callback)
                    })), e.prototype.$jsBridge.registerHandler = function(e) {
                        i("JSBridgeSuperFn", (function(t) {
                            try {
                                e(JSON.parse(decodeURIComponent(t)))
                            } catch (n) {
                                e({
                                    code: 500,
                                    msg: "返回结果非标准JSONString",
                                    data: t
                                })
                            }
                        }))
                    }
                }
            },
            G = [],
            K = {
                install: function(e, t) {
                    e.prototype.$jsBridge = {
                        registerHandler: function(e, t) {
                            console.error("jsbridge registerHandler 初始化失败"), t({
                                code: 500,
                                msg: "jsbridge registerHandler 初始化失败"
                            })
                        },
                        callHandler: function(e, t, n) {
                            G.push({
                                name: e,
                                params: t,
                                callback: n
                            })
                        },
                        AppBridgeSuperFn: function(e, t, n) {
                            console.error("jsbridge AppBridgeSuperFn 初始化失败"), n({
                                code: 500,
                                msg: "jsbridge AppBridgeSuperFn 初始化失败"
                            })
                        },
                        appIsInstalled: function() {
                            var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : "talku",
                                t = document.createElement("iframe");
                            return t.style.display = "none", t.src = "".concat(e, "://superfn/"), document.documentElement.appendChild(t), new Promise((function(e, n) {
                                setTimeout((function() {
                                    e(!0), document.documentElement.removeChild(t)
                                }), 2e3)
                            }))
                        }
                    }, e.prototype.$jsBridgeCmd = {
                        chooseImage: "chooseImage"
                    }, e.prototype.$jsBridgeSuType = r || {}, e.prototype.$device = V, V.android ? R(z(e)) : V.ios && W(z(e))
                }
            },
            q = K;
        V.android || V.ios;
        i["a"].config.productionTip = !1, i["a"].prototype.$bridge = b, i["a"].prototype.$global = j, i["a"].use(_), i["a"].use(q);
        var Q = new i["a"]({
            router: g,
            store: I["a"],
            render: function(e) {
                return e(l)
            }
        }).$mount("#app");
        t["default"] = Q
    },
    "4ee2": function(e, t, n) {},
    5262: function(e, t, n) {
        e.exports = n.p + "media/answer_correct_test.03aa0823.mp3"
    },
    5375: function(e, t, n) {
        "use strict";
        var r = n("2b0e"),
            i = n("2f62"),
            o = n("a284"),
            a = n("89cb"),
            c = {
                state: {
                    userInfo: Object(o["c"])(),
                    activityInfo: {},
                    challengeIndexInfo: {},
                    uid: 0,
                    shareLink: ""
                },
                mutations: {
                    TOGGLE_USERINFO: function(e, t) {
                        3 === t.pid ? t.appId = 67 : t.appId = 66, e.userInfo = t, localStorage.setItem("clientUserInfo", JSON.stringify(t))
                    },
                    UPDATE_ACTIVITY_INFO: function(e, t) {
                        e.activityInfo = t
                    },
                    UPDATE_UID: function(e, t) {
                        e.uid = t
                    },
                    UPDATE_SHARE_LINK: function(e, t) {
                        e.shareLink = t
                    },
                    UPDATE_CHALLENGE_INFO: function(e, t) {
                        e.challengeIndexInfo = t
                    }
                },
                actions: {
                    getGameShareLink: function(e, t) {
                        var n = e.commit,
                            r = (e.state, t.campaignId),
                            i = t.shareNumber;
                        return new Promise((function(e, t) {
                            Object(a["a"])(r, i).then((function(t) {
                                1 === t.code && (n("UPDATE_SHARE_LINK", t.data.shareLink), e())
                            })).catch((function(e) {
                                console.log(e + "获取分享链接失败"), t()
                            }))
                        }))
                    }
                }
            },
            s = c,
            u = {
                game_activity: function(e) {
                    return e.game_activity
                }
            },
            d = u;
        r["a"].use(i["a"]);
        var l = new i["a"].Store({
            modules: {
                game_activity: s
            },
            getters: d
        });
        t["a"] = l
    },
    "7dba": function(e, t, n) {
        "use strict";
        var r = n("a229"),
            i = n.n(r);
        i.a
    },
    "7f3f": function(e, t, n) {
        e.exports = n.p + "media/game_success.d7be4865.mp3"
    },
    "89cb": function(e, t, n) {
        "use strict";
        n.d(t, "a", (function() {
            return o
        }));
        var r, i = n("b775");

        function o(e, t) {
            return Object(i["a"])({
                url: r + "share/getShareLink",
                method: "get",
                params: {
                    campaignPid: e,
                    shareNumber: t,
                    timeStamp: (new Date).getTime()
                }
            })
        }
        window.console.log("全局sharejs------", "production"), r = "https://apiconfig.dt-pn1.com/api/"
    },
    "8c27": function(e, t, n) {
        e.exports = n.p + "media/bgm.9728d588.mp3"
    },
    9810: function(e, t, n) {},
    a07f: function(e, t, n) {},
    a229: function(e, t, n) {},
    a284: function(e, t, n) {
        "use strict";
        n("4917");
        var r = n("2b0e"),
            i = {
                server: {
                    dev: "http://apigateway.dt-dn1.com:9230",
                    prod: "https://dt-apigatewayv2.dt-pn1.com"
                },
                inviteReport: {
                    dev: "http://165.22.132.191:9241",
                    prod: "https://dt-apigateway-log.dt-pn1.com/dt-invite"
                }
            },
            o = i,
            a = n("b775"),
            c = o.inviteReport.prod;

        function s(e, t, n, r, i, o) {
            var s = new Date,
                u = s.getTimezoneOffset();
            return Object(a["a"])({
                url: c + "/retrieveInviter/retrieve",
                method: "post",
                data: {
                    InviteKey: e,
                    tzOffset: u,
                    d: 0,
                    referer: "",
                    pid: n,
                    language: navigator.language || navigator.userLanguage,
                    userAgent: navigator.userAgent,
                    url: encodeURIComponent(t),
                    domain: window.location.host,
                    requestTime: s.getTime(),
                    eventType: r,
                    deviceId: i,
                    userId: o
                }
            })
        }
        n("6b54"), n("28a5");

        function u(e, t) {
            var n = e.toString().split("."),
                r = t.toString().split("."),
                i = Math.min(n.length, r.length),
                o = 0,
                a = 0,
                c = !1;
            while (o < i) {
                if (a = parseInt(n[o]) - parseInt(r[o]), 0 != a) {
                    if (a > 0) {
                        c = !0;
                        break
                    }
                    c = !1;
                    break
                }
                o++
            }
            return c
        }

        function d() {
            var e = {
                c: "",
                d: "",
                deviceId: "",
                dtId: "",
                i: "",
                lang: "",
                loginIp: "",
                loginisoCC: "CN",
                osType: "",
                pid: 3,
                token: "",
                uid: "",
                userId: 0,
                version: "",
                nickName: "My friend,",
                jwttoken: ""
            };
            return e
        }
        n.d(t, "c", (function() {
            return d
        })), n.d(t, "a", (function() {
            return f
        })), n.d(t, "d", (function() {
            return m
        })), n.d(t, "b", (function() {
            return g
        }));
        var l = !1;

        function p() {
            l = !!document.hidden
        }

        function f(e, t, n, r) {
            if (s(n, r, e, "INVITE_SKIPAPPSTORE"), navigator.userAgent.match(/(iPhone|iPod|iPad);?/i)) {
                if (navigator.userAgent.match(/(iPhone|iPod|iPad);?/i)) {
                    var i = document.createElement("textarea");
                    i.value = "=%$".concat(n, "=%$%$%").concat(r, "=%$%$%"), document.body.appendChild(i), i.select(), document.execCommand("Copy"), i.style.display = "none", console.log("复制成功")
                }
                window.location.href = 3 === e ? "tztalktone://superfn/" : "tzdingtone://superfn/", setTimeout((function() {
                    l || (window.location.href = 3 === e ? "https://itunes.apple.com/app/apple-store/id863809868?pt=97408004&ct=" + t + "&mt=8" : "https://itunes.apple.com/app/apple-store/id588937297?pt=832181&ct=" + t + "&mt=8")
                }), 2500)
            } else {
                window.location.href = 3 === e ? "tztalktone://superfn/" : "tzdingtone://superfn/";
                var o = encodeURIComponent(r);
                setTimeout((function() {
                    l || (location.href = 3 === e ? "https://play.google.com/store/apps/details?id=me.talkyou.app.im&referrer=utm_source=".concat(t, "&utm_content=autoinvite_").concat(n, "&utm_url=").concat(o) : "https://play.google.com/store/apps/details?id=me.dingtone.app.im&referrer=utm_source=".concat(t, "&utm_content=autoinvite_").concat(n, "&utm_url=").concat(o))
                }), 1500)
            }
        }

        function m(e, t) {
            navigator.userAgent.match(/(iPhone|iPod|iPad);?/i) ? window.location.href = 3 === e ? "https://itunes.apple.com/app/apple-store/id863809868?pt=97408004&ct=" + t + "&mt=8" : "https://itunes.apple.com/app/apple-store/id588937297?pt=832181&ct=" + t + "&mt=8" : window.location.href = 3 === e ? "https://play.google.com/store/apps/details?id=me.talkyou.app.im&referrer=utm_source%3DdefaultLink%26utm_content%3Dautoinvite_voT3gi&activityName=" + t : "https://play.google.com/store/apps/details?id=me.dingtone.app.im&referrer=utm_source%3DdefaultLink%26utm_content%3Dautoinvite_voT3gi&activityName=" + t
        }

        function g(e, t, n, i) {
            return console.log("clientEvent"), new Promise((function(o, a) {
                if (navigator.userAgent.match(/(iPhone|iPod|iPad);?/i))
                    if (3 === n) {
                        if (5402 === e && u("3.6.0", i)) return;
                        if (5601 === e && u("3.6.1", i)) return;
                        if (5404 === e || 5405 === e || 5406 === e) return void a();
                        if (101 === e) return void a()
                    } else {
                        if (5402 === e && u("4.9.0", i)) return;
                        if (5601 === e && u("4.9.0", i)) return;
                        if (5404 === e || 5405 === e || 5406 === e) return void a();
                        if (101 === e) return void a()
                    }
                else if (3 === n) {
                    if (5402 === e && u("4.13.0", i)) return;
                    if (5601 === e && u("4.14.2", i)) return;
                    if ((5404 === e || 5405 === e || 5406 === e) && u("4.14.4", i)) return void a();
                    if (101 === e && u("4.14.4", i)) return void a()
                } else {
                    if (5402 === e && u("4.12.4", i)) return;
                    if (5404 === e || 5405 === e || 5406 === e) return void a();
                    if (101 === e) return void a();
                    if (5601 === e && u("4.13.3", i)) return
                }
                if (r["a"].prototype.$jsBridge.callHandler(e, t, (function(n) {
                        5403 === e && u(i, "4.13.0") && o(n), 5404 !== e && 101 !== e || o(n), console.log("客户端参数".concat(t), t, "客户端交互".concat(e, ":"), n)
                    })), 5601 === e)
                    if (navigator.userAgent.match(/(iPhone|iPod|iPad);?/i))
                        if (console.log("ios 看广告"), 3 === n) switch (!0) {
                            case u("3.6.1", i):
                                console.log("ios客户端回调点击返回<3.6.1:");
                                break;
                            default:
                                r["a"].prototype.$jsBridge.registerHandler((function(e) {
                                    o(e), console.log("ios客户端回调点击返回>=3.6.1:" + JSON.stringify(e.data))
                                }));
                                break
                        } else switch (!0) {
                            case u("4.9.0", i):
                                console.log("ios客户端回调点击返回<4.9.0:");
                                break;
                            default:
                                r["a"].prototype.$jsBridge.registerHandler((function(e) {
                                    o(e), console.log("ios客户端回调点击返回>=4.9.0:" + JSON.stringify(e.data))
                                }));
                                break
                        } else if (3 === n) switch (!0) {
                            case u("4.14.2", i):
                                console.log("andorid talkU客户端回调点击返回<4.14.2:");
                                break;
                            default:
                                console.log("andorid客户端回调点击返回>=4.14.2:"), r["a"].prototype.$jsBridge.registerHandler((function(e) {
                                    o(e), console.log("andorid talkU客户端回调点击返回>=4.14.2:" + JSON.stringify(e))
                                }));
                                break
                        } else switch (!0) {
                            case u("4.13.2", i):
                                console.log("andorid dingtone客户端回调点击返回<4.13.2:");
                                break;
                            default:
                                r["a"].prototype.$jsBridge.registerHandler((function(e) {
                                    o(e), console.log("andorid dingtone客户端回调点击返回>=4.13.2:" + JSON.stringify(e))
                                }));
                                break
                        }
                if (5400 === e)
                    if (navigator.userAgent.match(/(iPhone|iPod|iPad);?/i))
                        if (console.log("ios 看广告"), 3 === n) switch (!0) {
                            case u("3.5.0", i):
                                console.log("ios客户端回调<3.5.0:"), o({
                                    result: 0
                                });
                                break;
                            default:
                                r["a"].prototype.$jsBridge.registerHandler((function(e) {
                                    o(e), console.log("ios客户端回调>=3.5.0:" + JSON.stringify(e.data))
                                }));
                                break
                        } else console.log("dingtone ios客户端回调"), o({
                            result: 0
                        });
                        else if (console.log("andorid 看广告"), 3 === n) switch (!0) {
                    case u("4.12.0", i):
                        console.log("andorid客户端回调<4.12.0:"), o({
                            result: 0
                        });
                        break;
                    default:
                        console.log("andorid客户端回调>=4.12.0:"), r["a"].prototype.$jsBridge.registerHandler((function(e) {
                            o(e), console.log("andorid客户端回调>=4.12.0:" + JSON.stringify(e))
                        }));
                        break
                } else console.log("dingtone andorid客户端回调"), o({
                    result: 0
                })
            }))
        }
        document.addEventListener("visibilitychange", p, !1)
    },
    a405: function(e, t, n) {},
    b20f: function(e, t, n) {},
    b775: function(e, t, n) {
        "use strict";
        var r = n("bc3a"),
            i = n.n(r),
            o = n("2b0e"),
            a = new o["a"],
            c = i.a.create({
                baseURL: Object({
                    NODE_ENV: "production",
                    BASE_URL: "//statich5.cheapmessageapp.com/h5/dingtone/"
                }).VUE_APP_BASE_API,
                withCredentials: !1,
                timeout: 5e3
            });
        c.interceptors.request.use((function(e) {
            return e
        }), (function(e) {
            return window.console.log(e), Promise.reject(e)
        })), c.interceptors.response.use((function(e) {
            var t = e.data;
            return (t.ErrCode || t.Reason) && console.log("ErrCode && Reason:", t.ErrCode, t.Reason), t
        }), (function(e) {
            return window.console.log("err" + e), a.$emit("network-is-online"), Promise.reject(e)
        }));
        t["a"] = c
    },
    c9b6: function(e, t, n) {
        "use strict";
        n.r(t);
        var r = function() {
                var e = this,
                    t = e.$createElement,
                    n = e._self._c || t;
                return n("div", {
                    directives: [{
                        name: "show",
                        rawName: "v-show",
                        value: e.show,
                        expression: "show"
                    }],
                    staticClass: "toast flex-row-center-center"
                }, [n("div", {
                    staticClass: "toastMask flex-col-center-center"
                }, ["success" === e.type ? n("div", {
                    staticClass: "background-hundred-zero success-icon icon"
                }) : e._e(), "error" === e.type ? n("div", {
                    staticClass: "background-hundred-zero failed-icon icon"
                }) : e._e(), "lodaing" === e.type ? n("div", {
                    staticClass: "background-hundred-zero loading-icon icon"
                }) : e._e(), n("div", {
                    staticClass: "text"
                }, [e._v(e._s(e.toastMsg))])])])
            },
            i = [],
            o = {
                data: function() {
                    return {
                        destroy: !1,
                        show: !0,
                        type: "",
                        toastMsg: ""
                    }
                },
                created: function() {
                    var e = this;
                    setTimeout((function() {
                        e.destroyElement()
                    }), 3e3)
                },
                methods: {
                    destroyElement: function() {
                        this.$destroy(), this.$el.parentNode.removeChild(this.$el)
                    }
                }
            },
            a = o,
            c = (n("7dba"), n("2877")),
            s = Object(c["a"])(a, r, i, !1, null, "3adc5539", null);
        t["default"] = s.exports
    },
    fe2f: function(e, t, n) {
        "use strict";
        var r = n("a405"),
            i = n.n(r);
        i.a
    }
});
