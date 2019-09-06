<script>
	let bugs = [false, true, false, false, true];
	let solved;

	const debug = (index) => {
		if (bugs[index] === true) return;
		bugs = bugs.map((bug, i) => bug === true ? true : Math.random() > 0.50 && i !== index);
		solved = !bugs.includes(true);
	}

	$: chanceToSolve = [...Array(bugs.length).keys()].slice(1).reduce((a,b) => a*b);
	const addBug = () => bugs = [...bugs, true];
	

	const deleteBug = () => {
		if (bugs.length == 2 ) {
			alert("Minimum");
			return	
		}
		bugs = bugs.filter((bug, i, t) => i !== t.length -1);
		console.log(bugs)
	} 
</script>
<div>
<p>Try to debug this...</p>
<p>You have a  1 / { chanceToSolve } chance to debug this (to undrstand why - see the code...)</p>
{#if !solved }
	{#each bugs as bug, i}
	<label class="switch">
		<input type="checkbox" on:change={ () => debug(i) } bind:checked={ bug }>
		<span class="slider round"></span>
	</label>
	{/each}
{:else}
	<p>'Hooray!!'</p>
{/if}
<button on:click={ addBug }>+</button>
<button on:click={ deleteBug }>-</button>
</div>

<style>
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
  background-color: #ccc;
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
  background-color: #2196F3;
}

input:focus + .slider {
  box-shadow: 0 0 1px #2196F3;
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