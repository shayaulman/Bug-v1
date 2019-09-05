<script>
	let bugs = [false, true, false, false, true];
	let solved = false;
	const debug = (index) => {
		if (bugs[index] === true) return;
		bugs = bugs.map((bug, i) => bug === true ? true : Math.random() > 0.50 && i !== index);
		solved = !bugs.includes(true);
	}

	let chance = [...Array(bugs.length).keys()].slice(1).reduce((a,b) => a*b);
	const addBug = () => {
		let a = [...bugs].push(true);
		bugs = a;
	}
</script>
<div>
<p>Try to debug this...</p>
<p>You have a  1 / { chance } chance to debug this (to undrstand why - see the code...)</p>
{#if !solved }
	{#each bugs as bug, i}
		<input type="checkbox" on:change={ () => debug(i) } bind:checked={ bug }>
	{/each}
{:else}
	<p>'Hooray!!'</p>
{/if}
<button on:click={ addBug }>+</button>
</div>