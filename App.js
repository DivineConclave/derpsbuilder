import { html, useState, useRef, useEffect } from 'https://esm.sh/htm/preact/standalone';
import { handleSubmit, fetchAndParseJSON } from './derps.js';

function filterAbilities(index, abilityCount, dynData) {
    console.log("filterAbilities called");
    const calling = document.getElementById('calling')?.value ?? undefined;
    if (index === abilityCount && calling) {
        //Compare lowercase values of ability.req and calling to filter the callingAbilities
        return dynData.callingAbilities.filter(ability => ability.req == "" || ability.req.toLowerCase() == calling.toLowerCase());
    }
    else {
        //Store the parsed integer value of the 'fort', 'cun' and 'jud' fields into const variables, but if any of the fields can't be found, just return dynData.generalAbilities unfiltered
        //document.getElementById('fort'), etc. may return null
        const fort = parseInt(document.getElementById('fort')?.value ?? 0);
        const cun = parseInt(document.getElementById('cun')?.value ?? 0);
        const jud = parseInt(document.getElementById('jud')?.value ?? 0);

        return dynData.generalAbilities.filter(ability => {
            //ability.req is a comma-separated list of requirements, e.g. "1 Fortitude, 2 Cunning" -- need to parse case insensitively and ignore more than one space in a token
            const reqs = ability.req.split(',').map(req => req.trim().toLowerCase());
            const skillCheck = reqs.every(req => {
                const reqValue = parseInt(req.charAt(0).toLowerCase());
                const stat = req.slice(1).trim().charAt(0);
                switch (stat) {
                    case 'f':
                        return fort >= reqValue;
                    case 'c':
                        return cun >= reqValue;
                    case 'j':
                        return jud >= reqValue;
                    default:
                        return false;
                }
            });

            return ability.req == "" || ability.req == "ANY" || skillCheck;
        });
    }
}

function calculateStats(path, dynData) {

    if (!dynData) {
        console.log("Not running calculateStats because dynData is undefined");
        return;
    }

    console.log("calculateStats called with path = " + path);

    if (!path) {
        path = "NO PATH";
    }
    const pathBaseStats = dynData.paths[path];
    const hp = document.getElementById('hp');
    const sp = document.getElementById('sp');
    const mp = document.getElementById('mp');
    const paragon = document.getElementById('paragon').value;
    const mundus = document.getElementById('msname').value;
    const stone = dynData.mundusEffects.find(stone => stone.name === mundus);
    const codeEffect = stone ? ('codeEffect' in stone ? stone.codeEffect : {}) : {};
    const hpBonus = (paragon == "+1 HP" ? 1 : 0) + ('HP' in codeEffect ? codeEffect.HP : 0);
    const spBonus = (paragon == "+1 SP" ? 1 : 0) + ('SP' in codeEffect ? codeEffect.SP : 0);
    const mpBonus = (paragon == "+1 MP" ? 1 : 0) + ('MP' in codeEffect ? codeEffect.MP : 0);
    console.log(`calculateStats: path=${path}, paragon=${paragon}, mundus=${mundus}, hpBonus=${hpBonus}, spBonus=${spBonus}, mpBonus=${mpBonus}`)

    if (path) {
        hp.value = pathBaseStats.HP + hpBonus;
        sp.value = pathBaseStats.SP + spBonus;
        mp.value = pathBaseStats.MP + mpBonus;
    }
}

function PathOptions({ dynData }) {
    console.log("PathOptions called");

    if (!dynData) {
        return html`<div>Loading...</div>`;
    }

    const generateOptions = () => {
        return Object.keys(dynData.paths).map(path => html`<option value="${path}">${path}</option>`);
    }

    return html`${generateOptions()}`;
};

function ForgeEffectNames({ dynData }) {
    console.log("ForgeEffectNames called");

    if (!dynData) {
        return html`<div>Loading...</div>`;
    }

    return dynData.forgeEffects.map(effect => html`<option value="${effect.name}">${effect.name}</option>`);
};

function MundusStoneNames({ dynData }) {
    console.log("MundusStoneNames called");

    if (!dynData) {
        return html`<div>Loading...</div>`;
    }

    return dynData.mundusEffects.map(stone => html`<option value="${stone.name}">${stone.name}</option>`);
};

function TableRows({ abilityCount, dynData }) {
    console.log("TableRow called");

    let retval = [];

    if (!dynData) {
        return html`<div>Loading...</div>`;
    }

    const calling = document.getElementById('calling')?.value ?? undefined;

    for (let index = 1; index <= abilityCount; index++) {
        const filteredAbilities = filterAbilities(index, abilityCount, dynData);
        retval.push(html`    
            <div class="row py-md-2">
                <div class="col col-md-3">
                    <select class="form-control" id="ability${index}" name="ability${index}" onChange=${(event) => onAbilityChange(event, index, dynData)}></select>
                </div>
                <div class="col col-sm-2"><input class="form-control" type="text" placeholder="Cost" name="cost${index}" id="cost${index}" readonly /></div>
                <div class="col col-sm-2"><input class="form-control" type="text" placeholder="Requirement" name="req${index}" id="req${index}" readonly /></div>
                <div class="col"><input class="form-control" type="text" placeholder="Explanation" name="exp${index}" id="exp${index}" readonly /></div>
            </div>
        `);
    }

    return html`${retval}`;
};

function onForgeChange(event, dynData) {
    console.log("onForgeChange called");

    if (!dynData) {
        return html`<div>Loading...</div>`;
    }

    const selectedEffect = dynData.forgeEffects.find(effect => effect.name === event.target.value);

    if (selectedEffect) {
        document.getElementById('fhad').value = selectedEffect.proc;
    } else {
        document.getElementById('fhad').value = '';
    }
};

function onPathChange(event, abilityCount, dynData) {
    console.log("onPathChange called with event.target.value = " + event.target.value);

    if (!dynData) {
        console.log("Not running onPathChange because dynData is undefined");
        return;
    }

    const callingRef = document.getElementById('calling');
    calculateStats(event.target.value, dynData);

    //Clear the calling options and regenerate them
    callingRef.innerHTML = "";
    if (event.target.value in dynData.callings) {
        dynData.callings[event.target.value].forEach(calling => {
            const newOption = document.createElement('option');
            newOption.value = calling;
            newOption.textContent = calling;
            callingRef.appendChild(newOption);
        });
    }

    onVirtuePointChange(abilityCount, dynData);
};

function onParagonChange(dynData) {
    console.log("onParagonChange called");
    calculateStats(document.getElementById('path').value, dynData);
}

function onMundusChange(event, dynData) {
    console.log("onMundusChange called");
    const selectedStone = dynData.mundusEffects.find(stone => stone.name === event.target.value);

    if (selectedStone) {
        document.getElementById('mseffect').value = selectedStone.effect;
    } else {
        document.getElementById('mseffect').value = '';
    }
    calculateStats(document.getElementById('path').value, dynData);
};

function onAbilityChange(event, index, dynData) {
    console.log("onAbilityChange called")
    const selectedAbility = dynData.callingAbilities.concat(dynData.generalAbilities).find(ability => ability.name === event.target.value);
    //Add [active], [passive] or [reactive] to ability descriptions
    const abilityType = selectedAbility?.type ? `[${selectedAbility.type}] ` : '';

    if (selectedAbility && selectedAbility.name != 'N/A') {
        document.getElementById(`exp${index}`).value = `${abilityType}${selectedAbility.exp}`;
        document.getElementById(`cost${index}`).value = selectedAbility.cost;
        document.getElementById(`req${index}`).value = selectedAbility.req;
    } else {
        document.getElementById(`exp${index}`).value = '';
        document.getElementById(`cost${index}`).value = '';
        document.getElementById(`req${index}`).value = '';
    }
}

function onCallingChange(event, abilityCount, dynData) {
    console.log("onCallingChange called");
    onVirtuePointChange(abilityCount, dynData);
}

function recalculateVp(dynData) {
    const vp = document.getElementById('vp');
    const path = document.getElementById('path').value;
    const calling = document.getElementById('calling').value;
    const validPaths = Object.keys(dynData.paths).filter(item => item != "NO PATH" && item != "");
    const pathCallings = Object.keys(dynData.callings).includes(path) ? dynData.callings[path] : [];
    const validCallings = pathCallings.filter(item => item != "NO CALLING" && item != "");
    console.log(`pathCallings = ${pathCallings}, validCallings = ${validCallings}`);
    const paladin = document.getElementById('paladin').checked;
    const prior = document.getElementById('prior').checked;
    const totalVp =
        (validPaths.includes(path) ? 2 : 0)
        + (prior ? 1 : 0)
        + (paladin ? 1 : 0)
        + (validCallings.includes(calling) ? 1 : 0);
    vp.value = totalVp;

    //The minimum for the 'fort', 'cun' and 'jud' fields is: 2 FORT if the path is WARRIOR; 2 CUN if the path is ROGUE; or 2 JUD if the path is MAGE. Otherwise the min is 0.
    //Set the .min and the .value accordingly.
    const fort = document.getElementById('fort');
    const cun = document.getElementById('cun');
    const jud = document.getElementById('jud');
    if (path === "WARRIOR") {
        fort.min = 2;
        fort.value = Math.max(fort.value, 2);
        cun.min = 0;
        jud.min = 0;
    } else if (path === "ROGUE") {
        cun.min = 2;
        cun.value = Math.max(cun.value, 2);
        fort.min = 0;
        jud.min = 0;
    } else if (path === "MAGE") {
        jud.min = 2;
        jud.value = Math.max(jud.value, 2);
        fort.min = 0;
        cun.min = 0;
    } else {
        fort.min = 0;
        cun.min = 0;
        jud.min = 0;
    }

    return totalVp;
}

//Change the 'max' attribute of the 'fort', 'cun', and 'jud' fields to match the new virtue point total from the 'vp' field, and recalculate the available abilities
function onVirtuePointChange(abilityCount, dynData) {
    console.log("onVirtuePointChange called");
    const fort = document.getElementById('fort');
    const cun = document.getElementById('cun');
    const jud = document.getElementById('jud');
    const totalVp = recalculateVp(dynData);

    let fv = parseInt(fort.value);
    let cv = parseInt(cun.value);
    let jv = parseInt(jud.value);
    while (fv + cv + jv > totalVp) {
        if (fv > 0) {
            fv--;
        } else if (cv > 0) {
            cv--;
        } else if (jv > 0) {
            jv--;
        }
    }

    fort.value = fv;
    cun.value = cv;
    jud.value = jv;

    // Set the max value of each field considering the values of the other two fields, but not exceeding totalVp in total
    let fortmax = totalVp - cv - jv;
    let cunmax = totalVp - fv - jv;
    let judmax = totalVp - fv - cv;
    console.log(`fort: ${fv}, cun: ${cv}, jud: ${jv}, fortmax: ${fortmax}, cunmax: ${cunmax}, judmax: ${judmax}`);
    fort.max = Math.max(0, fortmax);
    cun.max = Math.max(0, cunmax);
    jud.max = Math.max(0, judmax);
    recalcAbilities(abilityCount, dynData);
}

function recalcAbilities(abilityCount, dynData) {
    console.log("recalcAbilities called");
    const calling = document.getElementById('calling').value;
    const path = document.getElementById('path').value;

    for (let index = 1; index <= abilityCount; index++) {
        const filteredAbilities = filterAbilities(index, abilityCount, dynData);
        const selectedAbility = document.getElementById(`ability${index}`).value;

        //Clear the options and regenerate them
        document.getElementById(`ability${index}`).innerHTML = "";
        filteredAbilities.forEach(ability => {
            const newOption = document.createElement('option');
            newOption.value = ability.name;
            newOption.textContent = ability.name;
            document.getElementById(`ability${index}`).appendChild(newOption);
        });

        const optionsArray = Array.from(document.getElementById(`ability${index}`).options); // Convert the options collection to an array
        const selectedAbilityIsAvailable = optionsArray.find(option => option.value == selectedAbility);
        if (selectedAbilityIsAvailable) {
            document.getElementById(`ability${index}`).value = selectedAbility;
        }
        else {
            document.getElementById(`ability${index}`).value = "N/A";
            onAbilityChange({ "target": { "value": "N/A" } }, index, dynData);
        }
    }
}

function App() {
    console.log("App called")
    const [abilityCount, setAbilityCount] = useState(3);
    const [dynData, setDynamicData] = useState(null);

    //Setup the dynamic data
    const fetchData = async () => {
        setDynamicData(await fetchAndParseJSON());
        console.log("Got the dynamic data!");
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (!dynData) {
        console.log("Loading message...");
        return html`<div>Loading...</div>`;
    }

    console.log("dynData = " + JSON.stringify(dynData));

    useEffect(() => {
        const path = document.getElementById('path').value;
        console.log("recalculating useEffect called with path = " + path);
        onPathChange({ "target": { "value": path } }, abilityCount, dynData);
        onCallingChange({ "target": { "value": document.getElementById('calling').value } }, abilityCount, dynData);
        onMundusChange({ "target": { "value": document.getElementById('msname').value } }, dynData);
        onForgeChange({ "target": { "value": document.getElementById('fheffect').value } }, dynData);
        onParagonChange(dynData);
    }, []);

    return (html`
<div>
    <form autocomplete="on" id="form">
        <div class="container">
            <div class="row py-lg-3">
                <h1>─────DERPS Character Sheet Builder─────</h1>
            </div>
            <div class="row">
                <label for="charName">Character Name:</label>
            </div>
            <div class="row">
                <div class="col-auto">
                    <input class="form-control" type="text" placeholder="Character Name" name="charName" />
                </div>
            </div>

            <div class="row py-3"></div>

            <div class="row">
                <label for="quote">Your Character's Quote:</label>
            </div>
            <div class="row">
                <div class="col-auto">
                    <textarea class="form-control" type="text" placeholder="Quote" name="quote" />
                </div>
            </div>

            <div class="row py-3"></div>

            <div class="row">
                <label for="path">Path:</label>
            </div>
            <div class="row">
                <div class="col-auto">
                    <select class="form-control" name="path" id="path" onChange=${(event) => onPathChange(event, abilityCount, dynData)}>
                        <${PathOptions} dynData=${dynData} />
                    </select>
                </div>
            </div>

            <div class="row py-3"></div>

            <div class="row">
                <label for="writ">Your Character's Writ of Ascension:</label>
            </div>
            <div class="row">
                <div class="col-auto">
                    <textarea class="form-control" type="text" placeholder="Writ of Ascension" name="writ" />
                </div>
            </div>

            <div class="row py-3"></div>

            <div class="row py-2">
                <h1>ARENA STATS ──────────</h1>
            </div>
            <div class="row py-md-2">
                <div class="col-auto">HP:</div>
                <div class="col-auto"><input class="form-control" type="text" id="hp" name="hp" readonly /></div>
                <div class="col-auto">SP:</div>
                <div class="col-auto"><input class="form-control" type="text" id="sp" name="sp" readonly /></div>
                <div class="col-auto">MP:</div>
                <div class="col-auto"><input class="form-control" type="text" id="mp" name="mp" readonly /></div>
            </div>
            <div class="row py-md-2">
                <div class="col-auto">Calling:</div>
                <div class="col-auto">
                    <select class="form-control" name="calling" id="calling" value="NO CALLING" onChange=${(event) => onCallingChange(event, abilityCount, dynData)}>
                    </select>
                </div>
            </div>
            <div class="row py-md-2">
                <div class="col-auto">Paragon Bonus:</div>
                <div class="col-auto">
                    <select class="form-control" name="paragon" id="paragon" value="N/A" onChange=${() => onParagonChange(dynData)}>
                        <option value="N/A">N/A</option>
                        <option value="+1 HP">+1 HP</option>
                        <option value="+1 SP">+1 SP</option>
                        <option value="+1 MP">+1 MP</option>
                    </select>
                </div>
                <div class="col-auto">League Passive:</div>
                <div class="col-auto"><input class="form-control" type="number" name="league" min="0" max="2" value="0" /></div>
            </div>

            <div class="row py-3"></div>

            <div class="row py-2">
                <h1>VIRTUE POINTS ──────────</h1>
            </div>
            <div class="row">
                <div class="col-auto">
                    <label for="vp">Points Earned:</label>
                    <input class="form-control" readonly type="number" id="vp" name="vp" min="0" max="5" value="0" onChange=${(event) => onVirtuePointChange(abilityCount, dynData)} />
                </div>
                <div class="col-auto p-2 border">
                    <label for="prior">Are you at least a Prior in the Clergy?</label>
                    <input class="form-control" type="checkbox" id="prior" name="prior" onChange=${(event) => onVirtuePointChange(abilityCount, dynData)} />
                </div>
                <div class="col-auto p-2 border">
                    <label for="paladin">Are you at least a Paladin?</label>
                    <input class="form-control" type="checkbox" id="paladin" name="paladin" onChange=${(event) => onVirtuePointChange(abilityCount, dynData)} />
                </div>
            </div>

            <div class="row py-3"></div>

            <div class="row py-2">
                <h2>Virtue Point Assignments</h2>
            </div>
            <div class="row">
                <div class="col-auto">
                    <div class="row py-md-2">
                        <div class="col col-md-3"><strong>Virtue</strong></div>
                        <div class="col col-md-3"><strong>GIVES Bonus</strong></div>
                        <div class="col col-md-3"><strong>Virtue Points</strong></div>
                    </div>
                    <div class="row py-md-2">
                        <div class="col col-md-3">Fortitude:</div>
                        <div class="col col-md-3"><input class="form-control" type="number" name="fortgive" min="0" max="1" value="0" /></div>
                        <div class="col col-md-3"><input class="form-control" type="number" id="fort" name="fort" min="0" max="0" value="0" onChange=${(event) => onVirtuePointChange(abilityCount, dynData)} /></div>
                    </div>
                    <div class="row py-md-2">
                        <div class="col col-md-3">Cunning:</div>
                        <div class="col col-md-3"><input class="form-control" type="number" name="cungive" min="0" max="1" value="0" /></div>
                        <div class="col col-md-3"><input class="form-control" type="number" id="cun" name="cun" min="0" max="0" value="0" onChange=${(event) => onVirtuePointChange(abilityCount, dynData)} /></div>
                    </div>
                    <div class="row py-md-2">
                        <div class="col col-md-3">Judgement:</div>
                        <div class="col col-md-3"><input class="form-control" type="number" name="judgive" min="0" max="1" value="0" /></div>
                        <div class="col col-md-3"><input class="form-control" type="number" id="jud" name="jud" min="0" max="0" value="0" onChange=${(event) => onVirtuePointChange(abilityCount, dynData)} /></div>
                    </div>
                </div>
            </div>

            <div class="row py-3"></div>

            <div class="row py-2">
                <h1>ARSENAL ──────────</h1>
            </div>
            <${TableRows} abilityCount=${abilityCount} dynData=${dynData} />

            <div class="row py-3"></div>

            <div class="row py-2">
                <h1>FORGE OF HOPE ITEM ──────────</h1>
            </div>
            <div class="row">
                <div class="col col-auto">ITEM TYPE:</div>
                <div class="col col-auto"><input class="form-control" type="text" name="fhitem" /></div>
                <div class="col col-auto">CUSTOM ITEM NAME:</div>
                <div class="col"><input class="form-control" type="text" name="fhname" /></div>
            </div>
            <div class="row py-2">
                <div class="col col-auto">EFFECT:</div>
                <div class="col col-md-4">
                    <select class="form-control" id="fheffect" name="fheffect" onChange=${(event) => onForgeChange(event, dynData)} >
                        <${ForgeEffectNames} dynData=${dynData} />
                    </select>
                </div>
                <div class="col col-auto">HOLY NUM:</div>
                <div class="col col-sm-1"><input class="form-control" type="number" min="1" max="20" value="" name="fhholy" /></div>
                <div class="col col-auto">A/D:</div>
                <div class="col col-sm-1"><input class="form-control" type="text" readonly id="fhad" name="fhad" /></div>
            </div>

            <div class="row py-3"></div>

            <div class="row py-2">
                <h1>MUNDUS STONE ──────────</h1>
            </div>
            <div class="row py-2">
                <div class="col col-auto">NAME:</div>
                <div class="col col-auto">
                    <select class="form-control" id="msname" name="msname" onChange=${(event) => onMundusChange(event, dynData)} >
                        <${MundusStoneNames} dynData=${dynData} />
                    </select>
                </div>
                <div class="col col-auto">PASSIVE EFFECT:</div>
                <div class="col"><input class="form-control" type="text" readonly id="mseffect" name="mseffect" /></div>
            </div>
            <div class="row py-2">
                <div class="col col-auto">OVERSEER :</div>
                <div class="col col-md-4"><input class="form-control" type="text" id="msoverseer" name="msoverseer" /></div>
                <div class="col col-auto">DATE:</div>
                <div class="col col-auto"><input class="form-control" type="date" id="msdate" name="msdate" /></div>
            </div>

            <div class="row py-4"></div>

            <div class="row">
                <div class="col">
                    <input class="btn btn-primary" onClick=${(event) => handleSubmit(event)} type="button" class="button" value="Generate Markdown!"></input>
                </div>
            </div>

            <div class="row py-4"></div>

            <div class="row">
                <div class="col">
                    <div id="copyMessage">Copied to clipboard!</div>
                    <label for="output">Output Markdown</label>
                    <textarea class="form-control" readonly name="output" id="output"></textarea>
                </div>
            </div>
        </div>
    </form>
</div>
`);
}

export default App;