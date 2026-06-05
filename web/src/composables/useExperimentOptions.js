import { computed, ref, watch } from "vue";

export function useExperimentOptions({
  API_BASE,
  errorMessage,
  t,
  getLocalizedConfigDisplay,
  formatConfigTag,
  formatAttackDisplay,
  formatDefenseDisplay,
}) {
  const selectedConfig = ref("");
  const experimentOptions = ref([]);
  const selectedCategory = ref("all");

  const selectedConfigOption = computed(() =>
    experimentOptions.value.find(
      (item) => item.value === selectedConfig.value
    )
  );

  const selectedExperimentDescription = computed(() => {
    return getLocalizedConfigDisplay(selectedConfigOption.value).description;
  });

  const selectedConfigPreview = computed(() => {
    return selectedConfigOption.value?.preview || null;
  });

  const displayConfigPreview = computed(() => {
    const preview = selectedConfigPreview.value;

    if (!preview) {
      return null;
    }

    return {
      ...preview,
      attack: formatAttackDisplay(
        selectedConfigOption.value?.attack,
        preview.attack
      ),
      defense: formatDefenseDisplay(
        selectedConfigOption.value?.defense,
        preview.defense
      ),
    };
  });

  const selectedConfigMetadata = computed(() => {
    const option = experimentOptions.value.find(
      (item) => item.value === selectedConfig.value
    );

    if (!option?.metadata) {
      return null;
    }

    const meta = option.metadata;
    const display = getLocalizedConfigDisplay(option);

    return {
      name: display.name,
      description: display.description,
      category: meta.category || "",
      tags: Array.isArray(meta.tags) ? meta.tags.map(formatConfigTag) : [],
    };
  });

  const configCategories = computed(() => {
    const cats = new Set(
      experimentOptions.value.map(
        (opt) => opt.metadata?.category || "uncategorized"
      )
    );
    return [...cats].sort();
  });

  const filteredExperimentOptions = computed(() => {
    if (selectedCategory.value === "all") {
      return experimentOptions.value;
    }
    return experimentOptions.value.filter(
      (opt) =>
        (opt.metadata?.category || "uncategorized") === selectedCategory.value
    );
  });

  watch(selectedCategory, () => {
    const current = filteredExperimentOptions.value.find(
      (opt) => opt.value === selectedConfig.value
    );
    if (!current && filteredExperimentOptions.value.length > 0) {
      selectedConfig.value = filteredExperimentOptions.value[0].value;
    }
  });

  function getSelectedExperimentLabel() {
    const option = experimentOptions.value.find(
      (item) => item.value === selectedConfig.value
    );

    return option
      ? getLocalizedConfigDisplay(option).name
      : selectedConfig.value;
  }

  async function loadExperimentOptions() {
    try {
      const response = await fetch(`${API_BASE}/configs`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to load configs");
      }

      experimentOptions.value = data.configs.filter((item) => item.valid);

      if (!selectedConfig.value && experimentOptions.value.length > 0) {
        selectedConfig.value = experimentOptions.value[0].value;
      }
    } catch (error) {
      errorMessage.value = error.message;
    }
  }

  return {
    selectedConfig,
    experimentOptions,
    selectedCategory,
    selectedConfigOption,
    selectedExperimentDescription,
    selectedConfigPreview,
    displayConfigPreview,
    selectedConfigMetadata,
    configCategories,
    filteredExperimentOptions,
    loadExperimentOptions,
    getSelectedExperimentLabel,
  };
}
