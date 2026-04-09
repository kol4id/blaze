const fs = require('fs');

let content = fs.readFileSync('src/lib/components/PlaylistCards.svelte', 'utf8');

// I already cleaned it up previously but it seems there was another copy of the modal markup inside PlaylistCards that was accidentally left. Let's completely remove the raw modal markup from PlaylistCards.svelte since it now uses PlaylistModal component.

content = content.replace(
    /		<div\n\t\t\tclass="modal-overlay"[\s\S]*?<\/div>\n\t\t<\/div>\n/g,
    ''
);

fs.writeFileSync('src/lib/components/PlaylistCards.svelte', content);
