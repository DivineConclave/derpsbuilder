import { html, useState, useRef } from 'https://esm.sh/htm/preact/standalone';
import { handleSubmit, fetchAndParseJSON } from './derps.js';

function filterAbilities(index, abilityCount, calling, dynData) {
    if (index === abilityCount) {
        return dynData.callingAbilities.filter(ability => ability.req == calling);
    }
    else {
        return dynData.generalAbilities;
    }
}

function TableRow(index, abilityCount, calling, dynData) {
    const filteredAbilities = filterAbilities(index, abilityCount, calling, dynData);
    return (html`
        <tr>
            <td>
                <select style="width: 50%; max-width: 400px;" id="ability${index}" name="ability${index}" onChange=${(event) => onAbilityChange(event, index, filteredAbilities)}>
                    <option value="">Select Ability</option>
                    <${AbilityOptions} abilities=${filteredAbilities} />
                </select>
            </td>
            <td><input type="text" placeholder="Explanation" name="exp${index}" id="exp${index}" readonly /></td>
            <td><input type="text" placeholder="Cost" name="cost${index}" id="cost${index}" readonly /></td>
            <td><input type="text" placeholder="Requirement" name="req${index}" id="req${index}" readonly /></td>
        </tr>
    `);
}

function AbilityOptions(abilities) {
    return abilities.map(ability => html`<option>${ability.name}</option>`);
}

function PathOptions(dynData) {
    return dynData.paths.map(path => html`<option>${path}</option>`);
}

function ForgeEffectNames(dynData) {
    return dynData.forgeEffects.map(effect => html`<option>${effect.name}</option>`);
}

function MundusStoneNames(dynData) {
    return dynData.mundusStones.map(stone => html`<option>${stone.name}</option>`);
}

function onAbilityChange(event, index, dynData) {
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

function onForgeChange(event, dynData) {
    const selectedEffect = dynData.forgeEffects.find(effect => effect.name === event.target.value);

    if (selectedEffect) {
        document.getElementById('fhad').value = selectedEffect.proc;
    } else {
        document.getElementById('fhad').value = '';
    }
}

function onMundusChange(event, dynData) {
    const selectedStone = dynData.mundusStones.find(stone => stone.name === event.target.value);

    if (selectedStone) {
        document.getElementById('mseffect').value = selectedStone.effect;
    } else {
        document.getElementById('mseffect').value = '';
    }
}

function App() {
    const [abilityCount, setAbilityCount] = useState(3);
    const calling = useRef();
    const dynamicData = fetchAndParseJSON();

    return (html`
    <div>
    <div style="width: 75%">
        <h1>─────DERPS Character Sheet Builder─────</h1>
        <form autocomplete="on" id="form">
            <h1><input style="width: 50%; max-width: 300px;" type="text" placeholder="Character Name" name="charName" />
            </h1>

            <label for="path">Your Character's Quote:</label>
            <h3><input type="text" placeholder="Quote" name="quote" /></h3>

            <label for="path">Path:</label>
            <h2><select style="width: 50%; max-width: 300px;" name="path" id="paths">
                <${PathOptions} dynData=${dynamicData} />
            </select></h2>

            <h2><input type="text" placeholder="Writ of Ascension" name="writ" /></h2>

            <h1>ARENA STATS ──────────</h1>
            <table>
                <tr>
                    <td>HP:</td>
                    <td><input type="number" name="hp" min="6" max="8" value="6" /></td>
                    <td>SP:</td>
                    <td><input type="number" name="sp" min="0" max="8" value="0" /></td>
                    <td>MP:</td>
                    <td><input type="number" name="mp" min="0" max="8" value="0" /></td>
                </tr>
                <tr>
                    <td>Calling:</td>
                    <td><select name="calling" id="calling" value="NO CALLING" ref=${calling}>
                        
                    </select></td>
                    <td>Paragon Bonus:</td>
                    <td><select name="paragon" id="paragonBonuses" value="N/A">
                        <option>N/A</option>
                        <option>+1 HP</option>
                        <option>+1 SP</option>
                        <option>+1 MP</option>
                    </select></td>
                    <td>League Passive:</td>
                    <td><input type="number" name="league" min="0" max="2" value="0" /></td>
                </tr>
            </table>

            <h1>VIRTUE POINTS ──────────</h1>
            <label for="vp">Points Earned =</label><input style="" type="number" name="vp" min="0" max="5" value="0" />
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
                    <td><input type="number" name="fortgive" min="0" max="1" value="0" /></td>
                    <td><input type="number" name="fort" min="0" max="5" /></td>
                </tr>
                <tr>
                    <td>Cunning:</td>
                    <td><input type="number" name="cungive" min="0" max="1" value="0" /></td>
                    <td><input type="number" name="cun" min="0" max="5" /></td>
                </tr>
                <tr>
                    <td>Judgement:</td>
                    <td><input type="number" name="judgive" min="0" max="1" value="0" /></td>
                    <td><input type="number" name="jud" min="0" max="5" /></td>
                </tr>
            </table>

            <h1>ARSENAL ──────────</h1>
            <table>
                <tbody>
                    ${Array.from({ length: abilityCount }, (_, index) => html`<${TableRow} index=${index + 1} calling=${calling.value} dynData=${dynamicData} />`)}
                </tbody>
            </table>

            <h1>FORGE OF HOPE ITEM ──────────</h1>
            <table>
                <tr>
                    <td>ITEM TYPE:</td>
                    <td><input type="text" name="fhitem" /></td>
                    <td>CUSTOM ITEM NAME:</td>
                    <td><input type="text" name="fhname" /></td>
                    <td>EFFECT:</td>
                    <td><select name="fheffect" onChange=${(event) => onForgeChange(event, dynamicData)}/>
                        <${ForgeEffectNames} dynData=${dynamicData} />
                    </select>
                    </td>
                    <td>HOLY NUM:</td>
                    <td><input type="number" min="1" max="20" value="" name="fhholy" /></td>
                    <td>A/D:</td>
                    <td><input type="text" readonly name="fhad" /></td>
                </tr>
            </table>

            <h1>MUNDUS STONE ──────────</h1>
            <table>
                <tr>
                    <td>NAME:</td>
                    <td><select name="msname" onChange=${(event) => onMundusChange(event, dynamicData)} >
                        <${MundusStoneNames} dynData=${dynamicData} />
                    </select></td>
                    <td>PASSIVE EFFECT:</td>
                    <td><input type="text" readonly name="mseffect" /></td>
                    <td>OVERSEER :</td>
                    <td><input type="text" name="msoverseer" /></td>
                    <td>DATE:</td>
                    <td><input type="date" name="msdate" /></td>
                </tr>
            </table>

            <input onclick="${(event) => handleSubmit(event)}" type="button" class="button" value="Process"></input>
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