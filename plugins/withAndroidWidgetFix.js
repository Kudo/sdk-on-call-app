const { withDangerousMod } = require('expo/config-plugins.js');
const fs = require('node:fs');
const path = require('node:path');

/**
 * Workaround for an upstream `expo-widgets` bug.
 *
 * `expo-widgets`' Android config plugin generates the widget `<string>` resources
 * (display name + description) but writes them to `res/xml/expo_widgets.xml`.
 * AAPT only registers `<string>` elements declared under `res/values/`, so the
 * `@string/<widget>_display_name` reference in the generated AndroidManifest
 * receiver (and in `res/xml/<widget>_info.xml`) fails to link:
 *
 *   AAPT: error: resource string/next_shift_widget_display_name not found.
 *
 * The upstream code clearly intends to write to `res/values` — it even creates a
 * `valuesDirectory` — but uses `xmlDirectory` by mistake. See
 * node_modules/expo-widgets/plugin/build/android/withAndroidWidgetFiles.js.
 *
 * This plugin relocates that file from `res/xml/` to `res/values/`.
 *
 * ORDER MATTERS: `withDangerousMod` callbacks execute in the reverse of their
 * registration order (the last-registered plugin runs first). To run AFTER
 * `expo-widgets` has written the file, this plugin must be listed BEFORE
 * `expo-widgets` in the `plugins` array.
 */
const withAndroidWidgetFix = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const resDir = path.join(config.modRequest.platformProjectRoot, 'app/src/main/res');
      const misplaced = path.join(resDir, 'xml', 'expo_widgets.xml');
      const correct = path.join(resDir, 'values', 'expo_widgets.xml');

      if (fs.existsSync(misplaced)) {
        await fs.promises.mkdir(path.dirname(correct), { recursive: true });
        await fs.promises.writeFile(correct, await fs.promises.readFile(misplaced, 'utf8'));
        await fs.promises.rm(misplaced);
      }

      return config;
    },
  ]);
};

module.exports = withAndroidWidgetFix;
