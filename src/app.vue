<template>
	<div class="home" style="color: black" @click="alertfn">{{ title }}</div>
</template>

<script>
import { ref } from "vue";
export default {
	setup() {
		const title = ref("hello, miniVite!");
		const alertfn = function () {
			alert(title.value);
		};
		return { title, alertfn };
	},
};
</script>
<style scoped>
.home {
	background: red;
}
</style>
