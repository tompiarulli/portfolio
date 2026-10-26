# Scripts

One-off scripts that build assets the site ships. Their output is committed, so nothing here runs during the site's build; rerun one only to change what it makes. Run them from the repository root with Python 3 and Pillow (in a virtualenv, say):

```bash
pip install -r scripts/requirements.txt
```

| Script     | Builds                                                                                            | Run                        |
| ---------- | ------------------------------------------------------------------------------------------------- | -------------------------- |
| `grass.py` | The Shut Down photo in `public/images/`, from a source photo in the git-ignored `assets/` folder. | `python3 scripts/grass.py` |

`grass.py` writes every width as AVIF, WebP and JPEG; AVIF needs Pillow 11.3 or later.
