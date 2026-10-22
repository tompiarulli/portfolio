# Scripts

One-off Python scripts that build assets the site ships. Their output is committed, so nothing here runs during the site's build; rerun one only to change what it makes. Run them from the repository root with Python 3, after installing Pillow (in a virtualenv, say):

```bash
pip install -r scripts/requirements.txt
```

| Script              | Builds                                                                                            | Run                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `logo.py`           | Nothing on its own: the 16x16 grid, SVG token and preview helpers the menu mark scripts share.    |                                                          |
| `outpost_logo.py`   | Outpost 31's menu mark, the `--logo` token in `src/styles.css`.                                   | `python3 scripts/outpost_logo.py [preview [file.png]]`   |
| `traveler_logo.py`  | OUTATIME's menu mark, the `--logo` token in `src/styles.css`.                                     | `python3 scripts/traveler_logo.py [preview [file.png]]`  |
| `steamboat_logo.py` | Steamboat's stand-in menu mark, the `--logo` token in `src/styles.css`.                           | `python3 scripts/steamboat_logo.py [preview [file.png]]` |
| `cde_icons.py`      | The dock icons in `public/icons/cde/`, from CDE's pixmaps (see `public/icons/README.md`).         | `python3 scripts/cde_icons.py <path to a CDE checkout>`  |
| `grass.py`          | The Shut Down photo in `public/images/`, from a source photo in the git-ignored `assets/` folder. | `python3 scripts/grass.py`                               |

The menu mark scripts print the token to paste over the theme's `--logo`; with `preview` they also write a zoomed PNG to check the drawing, the only part of them that needs Pillow. `grass.py` writes every width as AVIF, WebP and JPEG; AVIF needs Pillow 11.3 or later.
