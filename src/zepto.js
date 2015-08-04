var Zepto = (function () {
    var slice = [].slice,
        key,
        css,
        $$,
        fragmentRE,
        container,
        document = window.document,
        undefined;

    // fix for iOS 3.2
    if (String.prototype.trim === undefined) {
        String.prototype.trim = function () {
            return this.replace(/^\s+/, '').replace(/\s+$/, '');
        };
    }

    function classRE(name) {
        return new RegExp("(^|\\s)" + name + "(\\s|$)");
    }

    function compact(array) {
        return array.filter(function (item) {
            return item !== undefined && item !== null;
        });
    }

    function flatten(array){
        return array.reduce(function(a, b){
            return a.concat(b);
        }, []);
    }

    function camelize(str) {
        return str.replace(/-+(.)?/g, function (match, chr) {
            return chr ? chr.toUpperCase() : '';
        });
    }

    fragmentRE = /^\s*<.+>/;
    container = document.createElement("div");
    function fragment(html) {
        container.innerHTML = ('' + html).trim();
        var result = slice.call(container.childNodes);
        container.innerHTML = '';
        return result;
    }

    function Z(dom, selector) {
        this.dom = dom || [];
        this.length = this.dom.length;
        this.selector = selector || '';
    }

    function $(selector, context) {
        if (selector == document) {
            return new Z;
        } else if (context !== undefined) {
            return $(context).find(selector);
        } else if (typeof selector === 'function') {
            return $(document).ready(selector);
        } else {
            var dom;
            if (selector instanceof Z) {
                dom = selector.dom;
            } else if (selector instanceof Array) {
                dom = compact(selector);
            } else if (selector instanceof Element || selector === window) {
                dom = [selector];
            } else if (fragmentRE.test(selector)) {
                dom = fragment(selector);
            } else {
                dom = $$(document, selector);
            }
            return new Z(dom, selector);
        }
    }

    $.extend = function (target, source) {
        for (key in source) {
            target[key] = source[key];
            return target;
        }
    }

    $.qsa = $$ = function (element, selector) {
        return slice.call(element.querySelectorAll(selector));
    }

    $.fn = {
        ready: function (callback) {
            document.addEventListener('DOMContentLoaded', callback, false);
            return this;
        },

        get: function (idx) {
            if (idx === undefined) {
                return this.dom;
            } else {
                return this.dom[idx];
            }
        },

        size: function() {
            return this.length;
        },

        remove: function () {
            return this.each(function () {
                this.parentNode.removeChild(el);
            });
        },

        each: function (callback) {
            this.dom.forEach(function (value) {
                callback.apply(value, arguments);
            });
            return this;
        },

        filter: function (selector) {
            return $(this.dom.filter(function (el) {
                return $$(el.parentNode, selector).indexOf(el) >= 0;
            }));
        },

        is: function (selector) {
            return this.length > 0 && $(this.dom[0]).filter(selector).length > 0;
        },

        first: function (callback) {
            return $(this.get(0));
        },

        last: function() {
            return $(this.get(this.length - 1));
        },

        find: function (selector) {
            var result;
            if (this.length == 1) {
                result = $$(this.get(0), selector);
            } else {
                result = flatten(this.dom.map(function(el) {
                    return $$(el, selector)
                }));
            }
            return $(result);
        },

        closest: function(selector, context) {
            var node = this.dom[0],
                nodes = $$(context !== undefined ? context : document, selector);
            if (nodes.length === 0) {
                node = null;
            }
            while(node && node !== document && nodes.indexOf(node) < 0) {
                node = node.parentNode;
            }
            return $(node);
        },

        parents: function(selector) {
            var ancestors = [],
                nodes = this.get();
            while (nodes.length > 0) {
                nodes = compact(nodes.map(function(node) {
                    if ((node = node.parentNode) && node !== document && ancestors.indexOf(node) < 0) {
                        ancestors.push(node);
                        return node;
                    }
                }));
            }
            ancestors = $(ancestors);
            if (selector === undefined) {
                return ancestors;
            } else {
                return ancestors.filter(selector);
            }
        },

        parent: function(selector) {
            var node,
                nodes = [];
            this.each(function() {
                if ((node = this.parentNode) && nodes.indexOf(node) < 0) {
                    nodes.push(node);
                }
            });
            nodes = $(nodes);
            if (selector === undefined) {
                return nodes;
            } else {
                return nodes.filter(selector);
            }
        },

        pluck: function (property) {
            return this.dom.map(function (element) {
                return element[property];
            });
        },

        show: function () {
            return this.css('display', 'block');
        },

        hide: function () {
            return this.css('display', 'none');
        },

        prev: function () {
            return $(this.pluck('previousElementSibling'));
        },

        next: function () {
            return $(this.pluck('nextElementSibling'));
        },

        html: function (html) {
            if (html === undefined) {
                if (this.length > 0) {
                    return this.dom[0].innerHTML;
                } else {
                    return null;
                }
            } else {
                return this.each(function () {
                    this.innerHTML = html;
                });
            }
        },

        text: function (text) {
            if (text === undefined) {
                if (this.length > 0) {
                    return this.dom[0].innerText;
                } else {
                    return null;
                }
            } else {
                return this.each(function () {
                    this.innerText = text;
                });
            }
        },

        attr: function (name, value) {
            if (typeof name == 'string' && value === undefined) {
                if (this.length > 0 && this.dom[0].nodeName === 'INPUT' && this.dom[0].type === 'text' && name === 'value') {
                    return this.dom[0].value;
                } else if (this.length > 0) {
                    return this.dom[0].getAttribute(name) || undefined;
                } else {
                    return null;
                }
            } else {
                this.each(function() {
                    if (typeof name == 'object') {
                        for (key in name) {
                            this.setAttribute(key, name[key]);
                        }
                    } else {
                        this.setAttribute(name, value);
                    }
                });
            }
        },

        css: function (prop, value) {
            if (value === undefined && typeof prop == 'string') {
                return this.dom[0].style[camelize(prop)];
            }
            css = "";
            for (k in prop) {
                css += k + ':' + prop[k] + ';';
            }
            if (typeof prop == 'string') {
                css = prop + ":" + value;
            }
            return this.each(function () {
                this.style.cssText += ';' + css;
            });
        },

        offset: function () {
            var obj = this.dom[0].getBoundingClientRect();
            return {
                left: obj.left + document.body.scrollLeft,
                top: obj.top + document.body.scrollTop,
                width: obj.width,
                height: obj.height
            };
        },

        index: function (element) {
            return this.dom.indexOf($(element).get(0));
        },

        hasClass: function (name) {
            return classRE(name).test(this.dom[0].className);
        },

        addClass: function (name) {
            return this.each(function () {
                //在这里学习了一下&&作为判断时的用法，好处是精简了代码，
                // 坏处是不利于阅读，对读代码的人要求高些，可以适当的写注释
                !$(this).hasClass(name) && (this.className += (this.className ? ' ' : '') + name);
            });
        },
        removeClass: function (name) {
            return this.each(function() {
                this.className = this.className.replace(classRE(name), ' ').trim();
            });
        },
        toggleClass: function(name, when) {
            return this.each(function() {
                if ((when !== undefined && !when) || $(this).hasClass(name)) {
                    $(this).removeClass(name);
                } else {
                    $(this).addClass(name);
                }
            });
        }
    };

    ['width', 'height'].forEach(function (property) {
        $.fn[property] = function () {
            return this.offset()[property];
        }
    });

    var adjacencyOperators = {
        append: 'beforeEnd',
        prepend: 'afterBegin',
        before: 'beforeBegin',
        after: 'afterEnd'
    };
    for (key in adjacencyOperators) {
        $.fn[key] = (function (operator) {
            return function (html) {
                return this.each(function() {
                    this['insertAdjacent' + (html instanceof Element ? 'Element' : 'HTML')](operator, html);
                });
            };
        })(adjacencyOperators[key]);
    }

    Z.prototype = $.fn;

    return $;
})();

'$' in window || (window.$ = Zepto);

