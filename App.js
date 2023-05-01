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

function calculateStats (path, dynData) {

    if(!dynData){
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

function PathOptions ({dynData}) {
    console.log("PathOptions called");

    if (!dynData) {
        return html`<div>Loading...</div>`;
    }

    const generateOptions = () => {
        return Object.keys(dynData.paths).map(path => html`<option value="${path}">${path}</option>`);
    }

    return html`${generateOptions()}`;
};

function ForgeEffectNames ({dynData}) {
    console.log("ForgeEffectNames called");

    if (!dynData) {
        return html`<div>Loading...</div>`;
    }

    return dynData.forgeEffects.map(effect => html`<option value="${effect.name}">${effect.name}</option>`);
};

function MundusStoneNames ({dynData}) {
    console.log("MundusStoneNames called");

    if (!dynData) {
        return html`<div>Loading...</div>`;
    }

    return dynData.mundusEffects.map(stone => html`<option value="${stone.name}">${stone.name}</option>`);
};

function TableRows ({abilityCount, dynData}) {
    console.log("TableRow called");

    let retval = [];

    if (!dynData) {
        return html`<div>Loading...</div>`;
    }

    const calling = document.getElementById('calling')?.value ?? undefined;

    for(let index = 1; index <= abilityCount; index++) {
        const filteredAbilities = filterAbilities(index, abilityCount, dynData);
        retval.push(html`
            <tr>
                <td>
                    <select style="max-width: 400px;" id="ability${index}" name="ability${index}" onChange=${(event) => onAbilityChange(event, index, dynData)}>
                        
                    </select>
                </td>
                <td><input type="text" placeholder="Explanation" name="exp${index}" id="exp${index}" readonly /></td>
                <td><input type="text" placeholder="Cost" name="cost${index}" id="cost${index}" readonly /></td>
                <td><input type="text" placeholder="Requirement" name="req${index}" id="req${index}" readonly /></td>
            </tr>
        `);
    }

    return html`<tbody>${retval}</tbody>`;
};

function onForgeChange (event, dynData) {
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

function onPathChange (event, abilityCount, dynData) {
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

function onParagonChange (dynData) {
    console.log("onParagonChange called");
    calculateStats(document.getElementById('path').value, dynData);
}

function onMundusChange (event, dynData) {
    console.log("onMundusChange called");
    const selectedStone = dynData.mundusEffects.find(stone => stone.name === event.target.value);

    if (selectedStone) {
        document.getElementById('mseffect').value = selectedStone.effect;
    } else {
        document.getElementById('mseffect').value = '';
    }
    calculateStats(document.getElementById('path').value, dynData);
};

function onAbilityChange (event, index, dynData) {
    console.log("onAbilityChange called")
    const selectedAbility = dynData.callingAbilities.concat(dynData.generalAbilities).find(ability => ability.name === event.target.value);

    if (selectedAbility) {
        document.getElementById(`exp${index}`).value = selectedAbility.exp;
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
    while(fv + cv + jv > totalVp) {
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

    for(let index = 1; index <= abilityCount; index++) {
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
            onAbilityChange({"target": { "value": "N/A"}}, index, dynData);
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
        onPathChange({"target": { "value": path}}, abilityCount, dynData);
        onCallingChange({"target": {"value": document.getElementById('calling').value}}, abilityCount, dynData);
        onMundusChange({"target": { "value": document.getElementById('msname').value}}, dynData);
        onForgeChange({"target": { "value": document.getElementById('fheffect').value}}, dynData);
        onParagonChange(dynData);
    }, []);

    return (html`
    <div>
    <div style="width: 75%">
        <h1>─────DERPS Character Sheet Builder─────</h1>
        <form autocomplete="on" id="form">
            <label for="charName">Character Name:</label>
            <input style="width: 50%; max-width: 300px;" type="text" placeholder="Character Name" name="charName" />

            <label for="quote">Your Character's Quote:</label>
            <input type="text" placeholder="Quote" name="quote" />

            <label for="path">Path:</label>
            <h2><select style="width: 50%; max-width: 300px;" name="path" id="path" onChange=${(event) => onPathChange(event, abilityCount, dynData)}>
                <${PathOptions} dynData=${dynData}/>
            </select></h2>

            <label for="writ">Your Character's Writ of Ascension:</label>
            <h2><input type="text" placeholder="Writ of Ascension" name="writ" /></h2>

            <h1>ARENA STATS ──────────</h1>
            <table>
                <tr>
                    <td>HP:</td>
                    <td><input type="number" id="hp" name="hp" min="6" max="8" value="6" readonly /></td>
                    <td>SP:</td>
                    <td><input type="number" id="sp" name="sp" min="0" max="9" value="0" readonly /></td>
                    <td>MP:</td>
                    <td><input type="number" id="mp" name="mp" min="0" max="9" value="0" readonly /></td>
                </tr>
                <tr>
                    <td>Calling:</td>
                    <td><select name="calling" id="calling" value="NO CALLING" onChange=${(event) => onCallingChange(event, abilityCount, dynData)}>
                    </select></td>
                    <td>Paragon Bonus:</td>
                    <td><select name="paragon" id="paragon" value="N/A" onChange=${() => onParagonChange(dynData)}>
                        <option value="N/A">N/A</option>
                        <option value="+1 HP">+1 HP</option>
                        <option value="+1 SP">+1 SP</option>
                        <option value="+1 MP">+1 MP</option>
                    </select></td>
                    <td>League Passive:</td>
                    <td><input type="number" name="league" min="0" max="2" value="0" /></td>
                </tr>
            </table>

            <h1>VIRTUE POINTS ──────────</h1>
            <label for="vp">Points Earned =</label><input style="width: 50%; max-width: 300px;" readonly type="number" id="vp" name="vp" min="0" max="5" value="0" onChange=${(event) => onVirtuePointChange(abilityCount, dynData)} />
            <label for="prior">Are you at least a Prior in the Clergy?</label><input type="checkbox" id="prior" name="prior" onChange=${(event) => onVirtuePointChange(abilityCount, dynData)} />
            <label for="paladin">Are you at least a Paladin?</label><input type="checkbox" id="paladin" name="paladin" onChange=${(event) => onVirtuePointChange(abilityCount, dynData)} />
            <h3>Virtue Point Assignments</h3>
            <table>
                <thead>
                    <tr>
                        <th>Virtue</th>
                        <th>GIVES Bonus</th>
                        <th>Virtue Points</th>
                    </tr>
                </thead>
                <tr>
                    <td>Fortitude:</td>
                    <td><input type="number" style="width: 50%;" name="fortgive" min="0" max="1" value="0" /></td>
                    <td><input type="number" style="width: 50%;" id="fort" name="fort" min="0" max="0" value="0" onChange=${(event) => onVirtuePointChange(abilityCount, dynData)}/></td>
                </tr>
                <tr>
                    <td>Cunning:</td>
                    <td><input type="number" style="width: 50%;" name="cungive" min="0" max="1" value="0" /></td>
                    <td><input type="number" style="width: 50%;" id="cun" name="cun" min="0" max="0" value="0" onChange=${(event) => onVirtuePointChange(abilityCount, dynData)}/></td>
                </tr>
                <tr>
                    <td>Judgement:</td>
                    <td><input type="number" style="width: 50%;" name="judgive" min="0" max="1" value="0" /></td>
                    <td><input type="number" style="width: 50%;" id="jud" name="jud" min="0" max="0" value="0" onChange=${(event) => onVirtuePointChange(abilityCount, dynData)}/></td>
                </tr>
            </table>

            <h1>ARSENAL ──────────</h1>
            <table>
                <${TableRows} abilityCount=${abilityCount} dynData=${dynData} />
            </table>
             
            <h1>FORGE OF HOPE ITEM ──────────</h1>
            <table>
                <tr>
                
                    <td>ITEM TYPE:</td>
                    <td><input type="text" name="fhitem" /></td>
                    <td>CUSTOM ITEM NAME:</td>
                    <td><input type="text" name="fhname" /></td>
                    <td>EFFECT:</td>
                    
                    <td><select id="fheffect" name="fheffect" onChange=${(event) => onForgeChange(event, dynData)} >
                        <${ForgeEffectNames} dynData=${dynData} />
                    </select>
                
                    </td>
                    
                    <td>HOLY NUM:</td>
                    <td><input type="number" min="1" max="20" value="" name="fhholy" /></td>
                    <td>A/D:</td>
                    <td><input type="text" readonly id="fhad" name="fhad" /></td>
                    
                </tr>
                
            </table>
            
            <h1>MUNDUS STONE ──────────</h1>
            <table>
                <tr>
                    <td>NAME:</td>
                    <td><select id="msname" name="msname" onChange=${(event) => onMundusChange(event, dynData)} >
                        <${MundusStoneNames} dynData=${dynData} />
                    </select></td>
                    <td>PASSIVE EFFECT:</td>
                    <td><input type="text" readonly id="mseffect" name="mseffect" /></td>
                    <td>OVERSEER :</td>
                    <td><input type="text" id="msoverseer" name="msoverseer" /></td>
                    <td>DATE:</td>
                    <td><input type="date" id="msdate" name="msdate" /></td>
                </tr>
            </table>
            
            <input onClick=${(event) => handleSubmit(event)} type="button" class="button" value="Process"></input>
            
        </form>
    </div>
    <div style="position: relative; margin-right: auto;">
        <div id="copyMessage">Copied to clipboard!</div>
        <label for="output">Output Markdown</label>
        <textarea readonly style="width: 90%; height: 500px;" name="output" id="output"></textarea>
    </div> 
</div>
`);
}

export default App;