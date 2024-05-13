<template>
  <div id="virtual-mirror" class="virtual-mirror">
    <slot name="vm-upper" />
    <slot name="vm-center" />
    <slot name="vm-lower" />
  </div>
</template>

<script lang="ts" setup>
import {
  shallowRef,
  computed,
  onMounted,
  onBeforeUnmount,
  withDefaults,
} from "vue";
import downloadImage from "@/utils/downloadImage";

export interface Props {
  screenshotName: string;
  target: string;
  lang: string;
  vmKey: string;
  channel: string;
  brand: string;
  storeId: string;
  upc: string;
  imageHandler: typeof downloadImage;
}

const props = withDefaults(defineProps<Props>(), {
  screenshotName: "",
  target: "target-mirror",
  lang: "en-US",
});
const emit = defineEmits(["close", "initialized", "error", "race"]);
const VM = shallowRef<any>(null);

const vmOptions = computed(() => {
  return {
    key: props.vmKey,
    channel: props.channel,
    brand: props.brand,
    storeId: props.storeId,
  };
});

const initVM = async () => {
  const { VirtualMirror } = await import("@luxottica/virtual-mirror");
  VM.value = VirtualMirror;

  const initVmPromise = new Promise((resolve, reject) => {
    VM.value
      .initialize({
        options: {
          ...vmOptions.value,
          locale: props.lang,
        },
      })
      .then(() => {
        const renderParams = {
          target: props.target,
          upc: props.upc,
        };
        emit("initialized", () => ({ screenshot, close, switchUpc }));
        return resolve(VM.value.renderMirror(renderParams));
      })
      .catch((err: any) => {
        emit("error", err);
        reject(err);
      });
  });

  const timeoutPromise = new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve("error");
    }, 30000);
  });

  Promise.race([initVmPromise, timeoutPromise])
    .then((value) => {
      if (value === "error") {
        const err = new Error("timeout expired");
        emit("error", err);
        return err;
      }
      return value;
    })
    .catch((err) => {
      emit("error", err);
    });
};
const screenshot = () => {
  VM.value.getScreenshot().then((response: object) => {
    const handler = props.imageHandler ?? downloadImage;
    const imgURI = "imgURI" in response ? (response.imgURI as string) : "";
    handler(imgURI, "virtual-mirror", props.screenshotName, props.lang);
  });
};

const switchUpc = (upc: string) => {
  VM.value.renderMirror({
    target: "target-mirror",
    upc: upc,
  });
};

const close = () => {
  const params = { target: props.target };
  VM.value.closeMirror(params);
};

onMounted(initVM);

onBeforeUnmount(async () => {
  return new Promise((resolve) => {
    if (VM.value && VM.value.close) {
      VM.value.close();
      resolve(true);
    }
  });
});
</script>

<style lang="scss">
.virtual-mirror {
  &:deep {
    .loading-bg {
      background: rgba(0, 0, 0, 0.85);
    }
    .nudging-guide {
      background: rgba(0, 0, 0, 0.5);
      width: auto;
      padding: 0;
      left: auto;
      right: auto;
      font-size: 14px;
      font-family: "Glacial Indifference Regular";
      span {
        padding: 24px 32px;
        display: inline-block;
      }
    }
  }
}
:deep {
  .virtual-mirror-root-style #notification {
    background: rgba(0, 0, 0, 0.7);
  }
}
</style>
