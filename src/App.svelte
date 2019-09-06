<script>
	let bugs = [false, true, false, false, true];
	let solved;

	$: chanceToSolve = [...Array(bugs.length).keys()].slice(1).reduce((a,b) => a*b);

	const debug = (index) => {
		if (bugs[index] === true) return;
		bugs = bugs.map((bug, i) => bug === true ? true : Math.random() > 0.50 && i !== index);
		solved = !bugs.includes(true);
	}

	const addBug = () => bugs = [...bugs, true];

	const deleteBug = () => {
		return bugs.length == 2 ? alert("You Reached the Minimum...")	
			: bugs = bugs.filter((bug, i, t) => i !== t.length -1);
	}
</script>
	<div class="container">
		<p>Try to debug this...</p>
		<p>You have a  <span class="badge -danger">1 / { chanceToSolve }</span> chance to "debug" this (to undrstand why - see the <a href="https://github.com/shayaulman/The-Big-Bug">code</a>)</p>
		{#if !solved }
			{#each bugs as bug, i}
				<div class="bugs-container d-flex flex-row justify-content-between">
					<label class="switch">
						<input type="checkbox" on:change={ () => debug(i) } bind:checked={ bug }>
						<span class="slider round"></span>
					</label>
					<p class="p-1">#Bug { i+1 }</p>
				
				</div>	
			{/each}
		<div class="justify-content-center align-items-center">
			<button class="btn btn-warning" on:click={ addBug }>+</button>
			<button class="btn btn-warning" on:click={ deleteBug }>-</button>
		</div>
	{:else}
		<h1>Hooray 🎉</h1>
		<button >Play Again!</button>
	{/if}
	</div>




<style>
.container {
	display: flex;
	justify-content: center;
	align-items: center;
	flex-direction: column;
}


/* source: https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_switch */
/* The switch - the box around the slider */
.switch {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
}

/* Hide default HTML checkbox */
.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

/* The slider */
.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: lightgreen;
  -webkit-transition: .4s;
  transition: .4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  -webkit-transition: .4s;
  transition: .4s;
}

input:checked + .slider {
  background-color: rgb(250, 65, 127);
}

input:focus + .slider {
  box-shadow: 0 0 1px lightgreen;
}

input:checked + .slider:before {
  -webkit-transform: translateX(26px);
  -ms-transform: translateX(26px);
  transform: translateX(26px);
}

/* Rounded sliders */
.slider.round {
  border-radius: 34px;
}

.slider.round:before {
  border-radius: 50%;
}

</style>