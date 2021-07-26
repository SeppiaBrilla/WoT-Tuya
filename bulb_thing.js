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


let bulb = {
    title: 'Smart bulb by tuya',
    name:"",
    description: `A smart bulb by tuya with a range of capabilities.`,
    support: 'https://developer.tuya.com/en/docs/iot',
    properties:{
        AllPossibleValues:{
            type:'object',
            description:'current status of the bulb, the properities can be changed via the command action',
            readOnly:true,
            properties:{
                switch_led:{
                  type:'boolean'
                },
                work_mode:{
                  type:'string',
                  enum:'"white","colour","scene","music"'
                },
                bright_value_v2:{
                  type:'integer',
                  min:10,
                  max:1000
                },
                temp_value_v2:{
                    type:'integer',
                    min:10,
                    max:1000
                },
                colour_data_v2:{
                  type:'object',
                  properties: {
                    h:{
                        type:'integer',
                        min:0,
                        max:360
                    },
                    s:{
                        type:'integer',
                        min:0,
                        max:1000
                    },
                    v:{
                        type:'integer',
                        min:0,
                        max:1000
                    }
                },
                scene_data_v2:{
                    type:'object',
                    values:[
                        {
                            bright:0,
                            h:0,
                            s:1000,
                            temperature:0,
                            unit_change_mode:'jump',
                            unit_gradient_duration:100,
                            unit_switch_duration:100,
                            v:1000
                        },
                        {
                            bright:0,
                            h:283,
                            s:1000,
                            temperature:0,
                            unit_change_mode:'jump',
                            unit_gradient_duration:100,
                            unit_switch_duration:100,
                            v:1000
                        },
                        {
                            bright:0,
                            h:240,
                            s:1000,
                            temperature:0,
                            unit_change_mode:'jump',
                            unit_gradient_duration:100,
                            unit_switch_duration:100,
                            v:1000
                        },
                        {
                            bright:0,
                            h:21,
                            s:1000,
                            temperature:0,
                            unit_change_mode:'jump',
                            unit_gradient_duration:100,
                            unit_switch_duration:100,
                            v:1000
                        },
                        {
                            bright:0,
                            h:307,
                            s:1000,
                            temperature:0,
                            unit_change_mode:'jump',
                            unit_gradient_duration:100,
                            unit_switch_duration:100,
                            v:1000
                        },
                        {
                            bright:0,
                            h:177,
                            s:1000,
                            temperature:0,
                            unit_change_mode:'jump',
                            unit_gradient_duration:100,
                            unit_switch_duration:100,
                            v:1000
                        },
                        {
                            bright:0,
                            h:97,
                            s:1000,
                            temperature:0,
                            unit_change_mode:'jump',
                            unit_gradient_duration:100,
                            unit_switch_duration:100,
                            v:1000
                        },
                        {
                            bright:0,
                            h:81,
                            s:1000,
                            temperature:0,
                            unit_change_mode:'jump',
                            unit_gradient_duration:100,
                            unit_switch_duration:100,
                            v:1000
                        }
                    ]
                },
                countdown_1:{
                  type:'integer',
                  min:0,
                  max:86400
                },
                music_data:{
                    type:'object',
                    properties:{
                      change_mode:{
                          type:'string',
                          range:['direct','gradient']
                        }, 
                        bright:{
                            type:'integer',
                            min:0,
                            max:1000
                        }, 
                        temperature:{
                            type:'integer',
                            min:0,
                            max:1000
                        }, 
                        h:{
                            type:'integer',
                            min:0,
                            max:360
                        },
                        s:{
                            type:'integer',
                            min:0,
                            max:255
                        },
                        v:{
                            type:'integer',
                            min:0,
                            max:255
                        }
                },
                control_data:{
                  type:'object',
                  properties:{
                    change_mode:{
                        type:'string',
                        range:['direct','gradient']
                    }, 
                    bright:{
                        type:'integer',
                        min:0,
                        max:1000
                    }, 
                    temperature:{
                        type:'integer',
                        min:0,
                        max:1000
                    }, 
                    h:{
                        type:'integer',
                        min:0,
                        max:360
                    },
                    s:{
                        type:'integer',
                        min:0,
                        max:255
                    },
                    v:{
                        type:'integer',
                        min:0,
                        max:255
                    }
                  }
                }
    
            }

        }
    }
        }
    },
    actions:{
        command:{
            description:'change a value of the bulb. Accept an object with the name of the value to change and a value to set (for value type refer to the AllPossibleValues section)',
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
        let data = await device.getData();
        bulb.name = data.result.name;
        WoT.produce(bulb).then((thing) => {
            let status = data.result.status;
            let obj= {};
            for(let i = 0; i < status.length; i++){
                obj[status[i].code] = status[i].value
                console.log({[status[i].code] : status[i].value});
            }
            console.log(obj)
            thing.writeProperty('AllPossibleValues',obj);
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
        });;
    })();
});



function delay(ms) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}