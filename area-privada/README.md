# OREO × LALIGA · Private area prototype

[Open the live prototype on GitHub Pages](https://esanchezhuertas-ux.github.io/oreo-2027-journey/area-privada/)

Open `area-privada/index.html` through a local HTTP server. From the repository root, run `python3 -m http.server 8000` and open <http://localhost:8000/area-privada/>.

## Design handoff

The links below open the reviewed desktop and mobile flows in the [Figma wireframes](https://www.figma.com/design/1TtnzqXH6iBZufWAJPRCzT/Oreo-Liga-2027---Wireframes?node-id=39-16684). Screen labels are in Spanish to match the prototype.

| Flow | What to check |
| --- | --- |
| [Mi zona and rewards](https://www.figma.com/design/1TtnzqXH6iBZufWAJPRCzT/Oreo-Liga-2027---Wireframes?node-id=39-7023) | The three rewards share a balance. Each widget shows progress, a redemption action, or the redeemed state. An available reward opens its request form. |
| [Collection sorting](https://www.figma.com/design/1TtnzqXH6iBZufWAJPRCzT/Oreo-Liga-2027---Wireframes?node-id=39-8673) | Newest first, oldest first and name A–Z. Changing the order preserves the view and the availability filter. |
| [Mixed copies](https://www.figma.com/design/1TtnzqXH6iBZufWAJPRCzT/Oreo-Liga-2027---Wireframes?node-id=335-1131592) | When a gold copy has been redeemed and a common copy is still available, the blue card appears in front. The gold copy, stars and “Canjeable” label remain visible. |
| [Card detail and codes](https://www.figma.com/design/1TtnzqXH6iBZufWAJPRCzT/Oreo-Liga-2027---Wireframes?node-id=53-142312) | Switch between the common and gold designs with the codes table open or closed. Each copy has its own code and status. |
| [Pack reveal](https://www.figma.com/design/1TtnzqXH6iBZufWAJPRCzT/Oreo-Liga-2027---Wireframes?node-id=330-1044311) | Every card starts with the same blue back. In a three-card pack with one gold card, the gold card is in the centre and turns last. The web prototype implements the interactive tilt, foil and sparkles. |
| [Review a redemption](https://www.figma.com/design/1TtnzqXH6iBZufWAJPRCzT/Oreo-Liga-2027---Wireframes?node-id=39-11140) | Check the selection and delivery details before confirming. Going back to edit retains the selection. |
| [Redemption history](https://www.figma.com/design/1TtnzqXH6iBZufWAJPRCzT/Oreo-Liga-2027---Wireframes?node-id=330-1014942) | The redeemed gold badge opens the corresponding shirt request in “Mi cuenta → Historial → Canjes”, with that row expanded. |
