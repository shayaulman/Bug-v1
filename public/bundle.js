
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
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
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

    // (47:2) {:else}
    function create_else_block(ctx) {
    	var h1, t_1, button, dispose;

    	return {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Hooray 🎉";
    			t_1 = space();
    			button = element("button");
    			button.textContent = "Play Again!";
    			attr(h1, "text-success", "");
    			add_location(h1, file, 47, 3, 1839);
    			attr(button, "class", "btn btn-success");
    			add_location(button, file, 48, 3, 1874);
    			dispose = listen(button, "click", ctx.click_handler);
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

    			dispose();
    		}
    	};
    }

    // (31:2) {#if !solved }
    function create_if_block(ctx) {
    	var div0, button0, t1, button1, t3, div1, dispose;

    	var each_value = ctx.bugs;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	return {
    		c: function create() {
    			div0 = element("div");
    			button0 = element("button");
    			button0.textContent = "+";
    			t1 = space();
    			button1 = element("button");
    			button1.textContent = "-";
    			t3 = space();
    			div1 = element("div");

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			attr(button0, "class", "btn btn-outline-warning");
    			add_location(button0, file, 32, 4, 1265);
    			attr(button1, "class", "btn btn-outline-warning");
    			add_location(button1, file, 33, 4, 1340);
    			attr(div0, "class", "justify-content-center align-items-center m-2");
    			add_location(div0, file, 31, 3, 1201);
    			attr(div1, "class", "bugs bg-light flex-column justify-content-between");
    			add_location(div1, file, 35, 2, 1426);

    			dispose = [
    				listen(button0, "click", ctx.addBug),
    				listen(button1, "click", ctx.deleteBug)
    			];
    		},

    		m: function mount(target, anchor) {
    			insert(target, div0, anchor);
    			append(div0, button0);
    			append(div0, t1);
    			append(div0, button1);
    			insert(target, t3, anchor);
    			insert(target, div1, anchor);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}
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
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div0);
    				detach(t3);
    				detach(div1);
    			}

    			destroy_each(each_blocks, detaching);

    			run_all(dispose);
    		}
    	};
    }

    // (37:3) {#each bugs as bug, i}
    function create_each_block(ctx) {
    	var div, label, input, t0, span, t1, h4, t2, t3_value = ctx.i+1 + "", t3, t4, dispose;

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
    			h4 = element("h4");
    			t2 = text("Bug #");
    			t3 = text(t3_value);
    			t4 = space();
    			attr(input, "type", "checkbox");
    			attr(input, "class", "svelte-l3ounh");
    			add_location(input, file, 39, 6, 1611);
    			attr(span, "class", "slider round svelte-l3ounh");
    			add_location(span, file, 40, 6, 1691);
    			attr(label, "class", "switch m-2 svelte-l3ounh");
    			add_location(label, file, 38, 5, 1578);
    			attr(h4, "class", "text-secondary m-2");
    			add_location(h4, file, 42, 5, 1745);
    			attr(div, "class", "bug d-flex justify-content-between p-2 svelte-l3ounh");
    			add_location(div, file, 37, 4, 1520);

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
    			append(div, h4);
    			append(h4, t2);
    			append(h4, t3);
    			append(div, t4);
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
    	var div, h3, t1, p0, t2, span0, input0, t3, t4, t5, p1, span1, t6, t7, t8, form, p2, label0, t9, input1, t10, p3, label1, t11, input2, t12, p4, label2, t13, select, option0, option1, t16, p5, label3, t17, textarea, t18, p6, button, dispose;

    	function select_block_type(changed, ctx) {
    		if (!ctx.solved) return create_if_block;
    		return create_else_block;
    	}

    	var current_block_type = select_block_type(null, ctx);
    	var if_block = current_block_type(ctx);

    	return {
    		c: function create() {
    			div = element("div");
    			h3 = element("h3");
    			h3.textContent = "Try to \"debug\"...";
    			t1 = space();
    			p0 = element("p");
    			t2 = text("On each \"debugging\" there is a ");
    			span0 = element("span");
    			input0 = element("input");
    			t3 = text(" % chance that one of the debugged (green) sliders will get buggy...\"");
    			t4 = space();
    			if_block.c();
    			t5 = space();
    			p1 = element("p");
    			span1 = element("span");
    			t6 = text(ctx.clickCounter);
    			t7 = text(" Times Clicked...");
    			t8 = space();
    			form = element("form");
    			p2 = element("p");
    			label0 = element("label");
    			t9 = text("Your Name: ");
    			input1 = element("input");
    			t10 = space();
    			p3 = element("p");
    			label1 = element("label");
    			t11 = text("Your Email: ");
    			input2 = element("input");
    			t12 = space();
    			p4 = element("p");
    			label2 = element("label");
    			t13 = text("Your Role: ");
    			select = element("select");
    			option0 = element("option");
    			option0.textContent = "Leader";
    			option1 = element("option");
    			option1.textContent = "Follower";
    			t16 = space();
    			p5 = element("p");
    			label3 = element("label");
    			t17 = text("Message: ");
    			textarea = element("textarea");
    			t18 = space();
    			p6 = element("p");
    			button = element("button");
    			button.textContent = "Send";
    			attr(h3, "class", "m-3");
    			set_style(h3, "color", "indigo");
    			add_location(h3, file, 28, 2, 806);
    			attr(input0, "class", "chance bg-light svelte-l3ounh");
    			attr(input0, "type", "number");
    			input0.value = "25";
    			attr(input0, "min", "1");
    			attr(input0, "max", "100");
    			input0.autofocus = true;
    			add_location(input0, file, 29, 118, 985);
    			attr(span0, "class", "chance-input badge badge-light svelte-l3ounh");
    			add_location(span0, file, 29, 73, 940);
    			attr(p0, "class", "alert alert-info text-center");
    			add_location(p0, file, 29, 2, 869);
    			attr(span1, "class", "badge badge-danger");
    			add_location(span1, file, 50, 17, 1981);
    			attr(p1, "class", "m-2");
    			add_location(p1, file, 50, 2, 1966);
    			attr(input1, "type", "text");
    			attr(input1, "name", "name");
    			add_location(input1, file, 53, 22, 2143);
    			add_location(label0, file, 53, 4, 2125);
    			add_location(p2, file, 52, 2, 2117);
    			attr(input2, "type", "email");
    			attr(input2, "name", "email");
    			add_location(input2, file, 56, 23, 2224);
    			add_location(label1, file, 56, 4, 2205);
    			add_location(p3, file, 55, 2, 2197);
    			option0.__value = "leader";
    			option0.value = option0.__value;
    			add_location(option0, file, 60, 6, 2341);
    			option1.__value = "follower";
    			option1.value = option1.__value;
    			add_location(option1, file, 61, 6, 2386);
    			attr(select, "name", "role[]");
    			select.multiple = true;
    			add_location(select, file, 59, 22, 2303);
    			add_location(label2, file, 59, 4, 2285);
    			add_location(p4, file, 58, 2, 2277);
    			attr(textarea, "name", "message");
    			add_location(textarea, file, 65, 20, 2484);
    			add_location(label3, file, 65, 4, 2468);
    			add_location(p5, file, 64, 2, 2460);
    			attr(button, "type", "submit");
    			add_location(button, file, 68, 4, 2546);
    			add_location(p6, file, 67, 2, 2538);
    			attr(form, "name", "contact");
    			attr(form, "method", "POST");
    			attr(form, "data-netlify", "true");
    			add_location(form, file, 51, 0, 2059);
    			attr(div, "class", "container svelte-l3ounh");
    			add_location(div, file, 27, 1, 780);
    			dispose = listen(input0, "focusout", ctx.updateChance);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, h3);
    			append(div, t1);
    			append(div, p0);
    			append(p0, t2);
    			append(p0, span0);
    			append(span0, input0);
    			append(p0, t3);
    			append(div, t4);
    			if_block.m(div, null);
    			append(div, t5);
    			append(div, p1);
    			append(p1, span1);
    			append(span1, t6);
    			append(p1, t7);
    			append(div, t8);
    			append(div, form);
    			append(form, p2);
    			append(p2, label0);
    			append(label0, t9);
    			append(label0, input1);
    			append(form, t10);
    			append(form, p3);
    			append(p3, label1);
    			append(label1, t11);
    			append(label1, input2);
    			append(form, t12);
    			append(form, p4);
    			append(p4, label2);
    			append(label2, t13);
    			append(label2, select);
    			append(select, option0);
    			append(select, option1);
    			append(form, t16);
    			append(form, p5);
    			append(p5, label3);
    			append(label3, t17);
    			append(label3, textarea);
    			append(form, t18);
    			append(form, p6);
    			append(p6, button);
    			input0.focus();
    		},

    		p: function update(changed, ctx) {
    			if (current_block_type === (current_block_type = select_block_type(changed, ctx)) && if_block) {
    				if_block.p(changed, ctx);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);
    				if (if_block) {
    					if_block.c();
    					if_block.m(div, t5);
    				}
    			}

    			if (changed.clickCounter) {
    				set_data(t6, ctx.clickCounter);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			if_block.d();
    			dispose();
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	const initBugs = [true, false, true, true, false];	
    	let bugs = [...initBugs];
    	let solved, clickCounter = 0;
    	const updateChance = () => { const $$result = bugChance = +document.querySelector('.chance').value / 100; return $$result; };

    	const debug = (index) => {
    		if (bugs[index] === true) return;
    		$$invalidate('bugs', bugs = bugs.map((bug, i) => bug === false ? bugChance > Math.random() && index !== i : true));
    		$$invalidate('solved', solved = !bugs.includes(true));
    		clickCounter ++; $$invalidate('clickCounter', clickCounter);	
    	};

    	const addBug = () => { const $$result = bugs = [...bugs, Math.random() > 0.5 ? true : false]; $$invalidate('bugs', bugs); return $$result; };

    	const deleteBug = () => {
    		var $$result = bugs.length == 2 ? alert("You Reached the Minimum...")	
    			: bugs = bugs.filter((bug, i, t) => i !== t.length -1); $$invalidate('bugs', bugs); return $$result;
    	};

    	const newGame = () => {
    		solved = !solved, clickCounter = 0, bugs = [...initBugs]; $$invalidate('solved', solved); $$invalidate('clickCounter', clickCounter); $$invalidate('bugs', bugs);
    	};

    	function input_change_handler({ bug, each_value, i }) {
    		each_value[i] = this.checked;
    		$$invalidate('bugs', bugs);
    	}

    	function change_handler({ i }) {
    		return debug(i);
    	}

    	function click_handler() {
    		return newGame();
    	}

    	let bugChance;

    	bugChance = 0.25;

    	return {
    		bugs,
    		solved,
    		clickCounter,
    		updateChance,
    		debug,
    		addBug,
    		deleteBug,
    		newGame,
    		input_change_handler,
    		change_handler,
    		click_handler
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
