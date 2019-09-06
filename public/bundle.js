
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.data !== data)
            text.data = data;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_update);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        if (component.$$.fragment) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, value) => {
                if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_update);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* src/App.svelte generated by Svelte v3.9.2 */

    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.bug = list[i];
    	child_ctx.each_value = list;
    	child_ctx.i = i;
    	return child_ctx;
    }

    // (38:1) {:else}
    function create_else_block(ctx) {
    	var h1, t_1, button;

    	return {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Hooray 🎉";
    			t_1 = space();
    			button = element("button");
    			button.textContent = "Play Again!";
    			add_location(h1, file, 38, 2, 1358);
    			add_location(button, file, 39, 2, 1379);
    		},

    		m: function mount(target, anchor) {
    			insert(target, h1, anchor);
    			insert(target, t_1, anchor);
    			insert(target, button, anchor);
    		},

    		p: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(h1);
    				detach(t_1);
    				detach(button);
    			}
    		}
    	};
    }

    // (23:2) {#if !solved }
    function create_if_block(ctx) {
    	var t0, div, button0, t2, button1, dispose;

    	var each_value = ctx.bugs;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	return {
    		c: function create() {
    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t0 = space();
    			div = element("div");
    			button0 = element("button");
    			button0.textContent = "+";
    			t2 = space();
    			button1 = element("button");
    			button1.textContent = "-";
    			attr(button0, "class", "btn btn-warning");
    			add_location(button0, file, 34, 3, 1206);
    			attr(button1, "class", "btn btn-warning");
    			add_location(button1, file, 35, 3, 1272);
    			attr(div, "class", "justify-content-center align-items-center");
    			add_location(div, file, 33, 2, 1147);

    			dispose = [
    				listen(button0, "click", ctx.addBug),
    				listen(button1, "click", ctx.deleteBug)
    			];
    		},

    		m: function mount(target, anchor) {
    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert(target, t0, anchor);
    			insert(target, div, anchor);
    			append(div, button0);
    			append(div, t2);
    			append(div, button1);
    		},

    		p: function update(changed, ctx) {
    			if (changed.bugs) {
    				each_value = ctx.bugs;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(t0.parentNode, t0);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}
    		},

    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);

    			if (detaching) {
    				detach(t0);
    				detach(div);
    			}

    			run_all(dispose);
    		}
    	};
    }

    // (24:3) {#each bugs as bug, i}
    function create_each_block(ctx) {
    	var div, label, input, t0, span, t1, p, t2, t3_value = ctx.i+1 + "", t3, dispose;

    	function input_change_handler() {
    		ctx.input_change_handler.call(input, ctx);
    	}

    	function change_handler() {
    		return ctx.change_handler(ctx);
    	}

    	return {
    		c: function create() {
    			div = element("div");
    			label = element("label");
    			input = element("input");
    			t0 = space();
    			span = element("span");
    			t1 = space();
    			p = element("p");
    			t2 = text("#Bug ");
    			t3 = text(t3_value);
    			attr(input, "type", "checkbox");
    			attr(input, "class", "svelte-ndzdoj");
    			add_location(input, file, 26, 6, 951);
    			attr(span, "class", "slider round svelte-ndzdoj");
    			add_location(span, file, 27, 6, 1031);
    			attr(label, "class", "switch svelte-ndzdoj");
    			add_location(label, file, 25, 5, 922);
    			attr(p, "class", "p-1");
    			add_location(p, file, 29, 5, 1085);
    			attr(div, "class", "bugs-container d-flex flex-row justify-content-between svelte-ndzdoj");
    			add_location(div, file, 24, 4, 848);

    			dispose = [
    				listen(input, "change", input_change_handler),
    				listen(input, "change", change_handler)
    			];
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, label);
    			append(label, input);

    			input.checked = ctx.bug;

    			append(label, t0);
    			append(label, span);
    			append(div, t1);
    			append(div, p);
    			append(p, t2);
    			append(p, t3);
    		},

    		p: function update(changed, new_ctx) {
    			ctx = new_ctx;
    			if (changed.bugs) input.checked = ctx.bug;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			run_all(dispose);
    		}
    	};
    }

    function create_fragment(ctx) {
    	var div, p0, t1, p1, t2, span, t3, t4, t5, a, t7, t8;

    	function select_block_type(changed, ctx) {
    		if (!ctx.solved) return create_if_block;
    		return create_else_block;
    	}

    	var current_block_type = select_block_type(null, ctx);
    	var if_block = current_block_type(ctx);

    	return {
    		c: function create() {
    			div = element("div");
    			p0 = element("p");
    			p0.textContent = "Try to debug this...";
    			t1 = space();
    			p1 = element("p");
    			t2 = text("You have a  ");
    			span = element("span");
    			t3 = text("1 / ");
    			t4 = text(ctx.chanceToSolve);
    			t5 = text(" chance to \"debug\" this (to undrstand why - see the ");
    			a = element("a");
    			a.textContent = "code";
    			t7 = text(")");
    			t8 = space();
    			if_block.c();
    			add_location(p0, file, 20, 2, 582);
    			attr(span, "class", "badge -danger");
    			add_location(span, file, 21, 17, 627);
    			attr(a, "href", "https://github.com/shayaulman/The-Big-Bug");
    			add_location(a, file, 21, 125, 735);
    			add_location(p1, file, 21, 2, 612);
    			attr(div, "class", "container svelte-ndzdoj");
    			add_location(div, file, 19, 1, 556);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, p0);
    			append(div, t1);
    			append(div, p1);
    			append(p1, t2);
    			append(p1, span);
    			append(span, t3);
    			append(span, t4);
    			append(p1, t5);
    			append(p1, a);
    			append(p1, t7);
    			append(div, t8);
    			if_block.m(div, null);
    		},

    		p: function update(changed, ctx) {
    			if (changed.chanceToSolve) {
    				set_data(t4, ctx.chanceToSolve);
    			}

    			if (current_block_type === (current_block_type = select_block_type(changed, ctx)) && if_block) {
    				if_block.p(changed, ctx);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);
    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			if_block.d();
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let bugs = [false, true, false, false, true];
    	let solved;

    	const debug = (index) => {
    		if (bugs[index] === true) return;
    		$$invalidate('bugs', bugs = bugs.map((bug, i) => bug === true ? true : Math.random() > 0.50 && i !== index));
    		$$invalidate('solved', solved = !bugs.includes(true));
    	};

    	const addBug = () => { const $$result = bugs = [...bugs, true]; $$invalidate('bugs', bugs); return $$result; };

    	const deleteBug = () => {
    		var $$result = bugs.length == 2 ? alert("You Reached the Minimum...")	
    			: bugs = bugs.filter((bug, i, t) => i !== t.length -1); $$invalidate('bugs', bugs); return $$result;
    	};

    	function input_change_handler({ bug, each_value, i }) {
    		each_value[i] = this.checked;
    		$$invalidate('bugs', bugs);
    	}

    	function change_handler({ i }) {
    		return debug(i);
    	}

    	let chanceToSolve;

    	$$self.$$.update = ($$dirty = { bugs: 1 }) => {
    		if ($$dirty.bugs) { $$invalidate('chanceToSolve', chanceToSolve = [...Array(bugs.length).keys()].slice(1).reduce((a,b) => a*b)); }
    	};

    	return {
    		bugs,
    		solved,
    		debug,
    		addBug,
    		deleteBug,
    		chanceToSolve,
    		input_change_handler,
    		change_handler
    	};
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, []);
    	}
    }

    var app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
