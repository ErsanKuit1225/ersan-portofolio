window['##BUDIBASE_APPDEFINITION##'] = {"hierarchy":{"name":"root","type":"root","children":[{"name":"customer","type":"record","fields":[{"name":"name","type":"string","typeOptions":{"maxLength":null,"values":null,"allowDeclaredValuesOnly":false},"label":"Name","getInitialValue":"default","getUndefinedValue":"default"},{"name":"enquiry","type":"string","typeOptions":{"maxLength":null,"values":["Google","Facebook","Word of Mouth"],"allowDeclaredValuesOnly":true},"label":"Enquiry Source","getInitialValue":"default","getUndefinedValue":"default"}],"children":[],"validationRules":[],"nodeId":1,"indexes":[],"allidsShardFactor":64,"collectionName":"customers","isSingle":false}],"pathMaps":[],"indexes":[{"name":"all_customers","type":"index","map":"return {...record};","filter":"","indexType":"ancestor","getShardName":"","getSortKey":"record.id","aggregateGroups":[],"allowedRecordNodeIds":[1],"nodeId":2}],"nodeId":0},"componentLibraries":[{"importPath":"/lib/node_modules/@budibase/standard-components/dist/index.js","libName":"@budibase/standard-components"}],"appRootPath":"/testApp2","props":{}}