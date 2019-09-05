<script>
	let bugs = [false, true, false, false, true];

	const debug = (index) => {
		if (bugs[index] === true) return

		bugs = bugs.map((bug, i) => bug === false && Math.random() > 0.5 && i !== index);
	}
</script>
<div>
	{#each bugs as bug, i}
		<input type="checkbox" on:change={() => debug(i)} bind:checked={bug}>
	<p>
		{i}
	</p>
	{/each}
</div>