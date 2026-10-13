<script>
import EditorSidebar from './components/EditorSidebar.vue'
import FlowCanvas from './components/FlowCanvas.vue'
import JsonDialog from './components/JsonDialog.vue'

export default {
  name: 'App',
  components: {
    EditorSidebar,
    FlowCanvas,
    JsonDialog,
  },
  data() {
    return {
      jsonVisible: false,
      graphJson: '',
      flowReadonly: false,
    }
  },
  methods: {
    onExport(json) {
      this.graphJson = json
      this.jsonVisible = true
    },
  },
}
</script>

<template>
  <main class="tw-min-h-screen tw-p-7">
    <FlowCanvas ref="flow" :readonly.sync="flowReadonly" @export="onExport">
      <template #sidebar="slotProps">
        <EditorSidebar :selected-node-label="slotProps.selectedNodeLabel"
          :has-selected-node="slotProps.hasSelectedNode" :readonly="slotProps.readonly"
          @update-label="slotProps.updateLabel" />
      </template>
    </FlowCanvas>

    <JsonDialog :visible="jsonVisible" :json="graphJson" @close="jsonVisible = false" />
  </main>
</template>
