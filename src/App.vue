<script setup lang="ts">
import { syntaxHighlight } from './libs/utils';
import type { LSValue, LSObj } from './libs/LSManager';
import { getLS, setLS, removeLS } from './libs/LSManager';

const jsons: Array<LSObj | LSValue | undefined> = [];

jsons.push(getLS());

setLS('/test', 100);
jsons.push(getLS());

setLS('/toto/tata', 666);
jsons.push(getLS());

removeLS('/test');
jsons.push(getLS());

jsons.push(null);
jsons.push(undefined);
jsons.push(getLS('/tutu'));

setLS('/toto/tutu');
jsons.push(getLS());

const obj = {} as LSObj;
setLS('blob/', obj);
jsons.push(getLS());
obj.test = true;
jsons.push(getLS());
obj.tset = false;
setLS('/blob', obj);
jsons.push(getLS());
</script>

<template>
  <main>
    <template v-for="(json, i) in jsons" :key="i">
      <div
        v-html="
      json === undefined
        ? 'undefined'
        : typeof json === 'object'
          ? syntaxHighlight(json as object)
          : json
      "
      ></div>
      <hr />
    </template>
  </main>
</template>

<style scoped>
header {
  line-height: 1.5;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
<style>
pre {
  outline: 1px solid #ccc;
  padding: 5px;
  margin: 5px;
}
.string {
  color: green;
}
.number {
  color: darkorange;
}
.boolean {
  color: blue;
}
.null {
  color: magenta;
}
.key {
  color: red;
}
</style>
