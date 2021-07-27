const Servient = require('@node-wot/core').Servient;
const HttpServer = require('@node-wot/binding-http').HttpServer;
const _Tuya = require('./easyTuya.js')._Tuya
const Device = require('./easyTuya.js').Device;
const dotenv = require("dotenv");
dotenv.config();

let key =  process.env.KEY;
let secret = process.env.SECRET;
let id = process.env.DEV1;
let region = process.env.REG;

const servient = new Servient();
servient.addServer(new HttpServer());


let thing = {
    title: '...',
    name:"",
    description: `A smart thing by tuya with a range of capabilities.`,
    support: 'https://developer.tuya.com/en/docs/iot',
    properties:{
        AllPossibleValues:{

        }
    },
    actions:{
        command:{
            description:'change a values of the thing. Accept an object with the name of the value to change and a value to set (for value type refer to the AllPossibleValues section)',
            input:{
                type:'object',
                properties:{
                    name:{
                        type:'string',
                        enum:['switch_led','work_mode','bright_value_v2','temp_value_v2','colour_data_v2','scene_data_v2','music_data','control_data','countdown_1']
                    },
                    new_value:{
                        type:'any'
                    }
                }
            },
            output:{
                type: 'object',
                description: `Returns true/false and a message when all invoked promises are resolved (asynchronous).`,
                properties: {
                    success:{
                        type: 'boolean',
                    },
                    message:{
                        type: 'string',
                    }
                }
            }
            
        }
    }
}

servient.start().then((WoT) => {
    (async()=>{
        let api = new _Tuya(region,key,secret);
        let device = new Device(id, api);
        produce(WoT, device);
        let device2 = new Device("vdevo162740447259972", api);
        produce(WoT, device2);
    })();
});

async function produce(WoT, device){
    let data = null;
    let functs = null;
    let functions = null;
    try{
        data = await device.getData();
        functs = await device.deviceFunctions();
        functions = functs.result.functions;
    }catch(e){
        console.log(e)
    }
    let AllPossibleValues = {};
    if(functs != null){
        AllPossibleValues = createFunctions(functions);
        
    }else{
        thing.actions = {};
        for( let i = 0; i < data.result.status.length; i++){
            AllPossibleValues[data.result.status[i].code] = {
                type: typeof data.result.status[i].value
            }
        }
    }
    thing.properties.AllPossibleValues = AllPossibleValues;
    thing.name = data.result.name;
    thing.title = data.result.product_name;
    let new_Ting = JSON.parse(JSON.stringify(thing));
    WoT.produce(new_Ting).then((thing) => {
        let status = data.result.status;
        let obj= {};
        for(let i = 0; i < status.length; i++){
            obj[status[i].code] = status[i].value;
        }
        thing.writeProperty('AllPossibleValues',obj);
        if(JSON.stringify(thing.actions) != JSON.stringify({})){
            thing.setActionHandler('command', (params, options)=>{
                let command = {
                    "code":"",
                    "value":null
                }
                if (typeof params == "object" && 'name' in params && 'new_value' in params) {
                    command.code = params.name,
                    command.value = params.new_value
                }
                else{
                    return { 'success': false, 'message': 'Error! Please provide all the required parameters'}
                }
                return device.control([command]).then((response) =>{
                    if(response.success){
                        return device.getData().then((data)=>{
                            let obj = {};
                            let status = data.result.status;
                            for(let i = 0; i < status.length; i++){
                                obj[status[i].code] = status[i].value;
                            }
                            return thing.writeProperty('AllPossibleValues', obj).then((resolve, reject)=>{
                                console.log(response);
                                return {'success':true, 'message': 'everything done!'};
                            });
                        })
                    }

                });
            })
        }
        thing.expose().then( () => { console.info(`${thing.getThingDescription().title} ready`); } ); 
        console.log(`Produced ${thing.getThingDescription().name}`);

        (async()=>{
            while(true){
                let status = (await device.getData()).result.status;
                let obj = {};
                for(let i = 0; i < status.length; i++){
                    obj[status[i].code] = status[i].value;
                }
                let prop = await thing.readProperty('AllPossibleValues');
                if(JSON.stringify(prop) != JSON.stringify(obj)){
                    thing.writeProperty('AllPossibleValues',obj);
                    console.log("updating properties");
                }
                await delay(5000)
            }
        })();
    }).catch((e) => {
        console.log(e);
    });
}


function delay(ms) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

function createFunctions(functions){
    let td = {};
    for(let i = 0; i < functions.length; i++){
        let func = functions[i];
        td[func["code"]] = determinateType(func);
    }
    return td;
}

function determinateType(element){
    let td = {};
    if(element["type"] == "Enum"){
        td = {
            type: "string",
            enum: JSON.parse(element["values"])["range"]
        }

    }else if(element["type"] == "Json"){
        td = {
            type: "object",
        }
        let values = JSON.parse(element["values"]);
        let keys = Object.keys(values);
        let out = {};
        for(let i = 0; i < keys.length; i++){
            out[keys[i]] = subElement(values[keys[i]])
        }
        td["properties"] = out;
    }else if(element["type"] == "Integer"){
        td = {
            type: "integer",
            min: JSON.parse(element["values"])["min"],
            max: JSON.parse(element["values"])["max"]
        }
    }else if(element["type" == "Boolean"]){
        td = {
            type:"boolean"
        }

    }else{
        td = {
            type:element["type"]
        }
    }
    return td;
}

function subElement(el){
    if(el.hasOwnProperty('min')){
        console.log(el, "integer");
        return {
            type:"integer",
            min:el["min"],
            max:el["max"]
        }
    }else if(el.hasOwnProperty('range')){
        console.log(el, "string");
        return{
            type:"string",
            enum:el["range"]
        }
    }else if(typeof el[Object.keys(el)[0]] == "object"){
        let keys = Object.keys(el);
        let output = {}
        for(let i = 0; i < keys.length; i++){
            output[keys[i]] = subElement(el[keys[i]]);
        }
        return output;
    }else{
        console.log(el, "general");
        return el;
    }
}