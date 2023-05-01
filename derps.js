async function copyTextToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        console.log('Text copied to clipboard');
    } catch (err) {
        console.error('Failed to copy text: ', err);
    }
}

async function fetchAndParseJSON() {
    try {
        const response = await fetch('dynamicData.json');
        return await response.json();
    } catch (err) {
        console.error('Error fetching and parsing JSON: ', err);
    }
}

async function handleSubmit(e) {
    e.preventDefault();
    const form = document.getElementById("form");
    let fields = Array.from(form.elements).reduce((acc, el) => ({ ...acc, [el.name]: el.value }), {});

    //Post-process the fields

    //Remove extraneous spaces from the values of all text fields
    for (const [key, value] of Object.entries(fields)) {
        if (typeof value === 'string') {
            fields[key] = value.trim();
        }
    }

    //Surround the 'quote' field in quotation marks if it isn't already
    if (fields['quote'].charAt(0) !== '"') {
        fields['quote'] = '"' + fields['quote'] + '"';
    }

    //Make sure the first character of the character name is capitalized
    fields['charName'] = fields['charName'].charAt(0).toUpperCase() + fields['charName'].slice(1);

    const md = `# ● D.E.R.P. Character Sheet ●

&#10;
&#10;

# ${fields['charName']}

## ${fields['quote']}

&#10;
&#10;

## ${fields['path']}

&#10;
&#10;

## ${fields['writ']}

&#10;
&#10;

# ARENA STATS ──────────
| HP: ${fields['hp']} | SP: ${fields['sp']} | MP: ${fields['mp']} | 
|----------|----------|----------|
| Calling: ${fields['calling']} | Paragon: ${fields['paragon']}   | Participation: +${fields['league']} |

&#10;
&#10;

# VIRTUE POINTS ──────────
Points Earned = ${fields['vp']}

|VIRTUE     |GIVES|Points|
|-----------|-----|------|
|Fortitude:| +${fields['fortgive']}   | ${fields['fort']}    |
|Cunning:  | +${fields['cungive']}   | ${fields['cun']}    |
|Judgement:| +${fields['judgive']}   | ${fields['jud']}    |

&#10;
&#10;

# ARSENAL ──────────
|NAME|EXPLANATION|COST|REQ|
|---|---|---|---|
|${fields['ability1']}|${fields['exp1']}|${fields['cost1']}|${fields['req1']}|
|${fields['ability2']}|${fields['exp2']}|${fields['cost2']}|${fields['req2']}|
|${fields['ability3']}|${fields['exp3']}|${fields['cost3']}|${fields['req3']}|

&#10;
&#10;

# FORGE OF HOPE ITEM ──────────
|ITEM|NAME|EFFECT|HOLY NUM|
|---|---|---|---|
|${fields['fhitem']}|${fields['fhname']}|${fields['fheffect']}|${fields['fhholy']}${fields['fhad']}|

&#10;
&#10;

# MUNDUS STONE ──────────
|NAME|PASSIVE EFFECT|OVERSEER |DATE|
|---|---|---|---|
|${fields['msname']}|${fields['mseffect']}|${fields['msoverseer']}|${fields['msdate']}|`;

    const textarea = document.querySelector("textarea");
    textarea.value = md;
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    await copyTextToClipboard(textarea.value);
    const copyMessage = document.getElementById('copyMessage');
    copyMessage.style.display = 'block';
    setTimeout(() => {
        copyMessage.style.display = 'none';
    }, 10000);
};

export { handleSubmit, fetchAndParseJSON };