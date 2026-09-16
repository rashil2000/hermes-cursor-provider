# Complete Cursor provider setup

The plugin code and its reviewed JavaScript dependencies are already installed.
Node 22.19 or newer must be available on the machine running Hermes.

On the Hermes Linux host, run:

```bash
export HERMES_HOME="${HERMES_HOME:-$HOME/.hermes}"
CURSOR_PLUGIN="$HERMES_HOME/plugins/cursor"

node --version
python "$CURSOR_PLUGIN" login --no-browser
python "$CURSOR_PLUGIN" models --available
```

Choose the exact model IDs you approve from that output, then configure them:

```bash
python "$CURSOR_PLUGIN" configure exact-model-id another-exact-model-id
python "$CURSOR_PLUGIN" models
python "$CURSOR_PLUGIN" doctor
hermes model --refresh
hermes gateway restart
```

The `hermes model` picker should now offer the `cursor` provider and only the
intersection of the configured IDs and models currently available to the
authenticated account.

For security and complete-removal instructions, see the plugin README.
