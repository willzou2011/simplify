// false type filter, the simplest filter
const FALSE_RESPONSE = { type: 'false' };

// flatten and filters to array
function flattenAndFilters(filters) {
  const len = filters.length;
  const flattenAndFilters = [];
  for (let i = 0; i < len; i++) {
    if (filters[i].type === 'and') {
      let filter1 = simplify(filters[i]);
      const filter1lLength = filter1.filters.length;
      for (let j = 0; j < filter1lLength; j++) {
        let filter2 = filter1.filters[j];
        flattenAndFilters.push(filter2);
      }
    }
  }
  return flattenAndFilters;
}

//remove duplicated elements in the array
function unique(values) {
  return values.filter((v,i) => values.indexOf(v) === i);
}

/**
 * simplify filter approach
 * 1. for false and is, just return as it is.
 * 2. for in, do some checks, e.g convert to is if only has one elements
 * 3. for and, flatten it first, then merge is and in filters.
 *  Basically it's an intersection operation. "Is" is regarded as in with one element.
 *  when intersection is empty, then return false;
 *  when intersection is one element, then convert to is
 *  when there is conflict between two "IS" filters, which also means empty intersection,
 *  return false as well
 */
function simplify(filter) {
  if(!filter.hasOwnProperty('type')) {
    throw "No type";
  }
  switch (filter.type) {
    case "and" :
      const result = [];
      let andFilters = filter.filters.filter( (f) => f.type === 'and');
      let flattenFilters = flattenAndFilters(andFilters);
      let noAndFilters = filter.filters.filter((f) => f.type !== 'and').concat(flattenFilters);

      const len = noAndFilters.length;
      let inFilterAttributeMap = new Map();
      for (let i = 0; i < len; i++) {
        let filter1 = simplify(noAndFilters[i]);
        if (filter1.type === 'false') {
          return FALSE_RESPONSE;
        }
        else if(filter1.type === 'is') {
          let key = filter1.attribute;
          let newVal = filter1.value;
          if(!inFilterAttributeMap.get(key)){
            inFilterAttributeMap.set(key, [newVal]);
          } else {
            let existingValues = inFilterAttributeMap.get(key);
            let intersectionValues = existingValues.filter(value => value === newVal);
            if(intersectionValues.length == 0) return FALSE_RESPONSE;
            else {
              inFilterAttributeMap.set(key, intersectionValues);
            }
          }
        }
        else if (noAndFilters[i].type === 'in') {
          let key = noAndFilters[i].attribute;
          let newVals = noAndFilters[i].values;
          if(!inFilterAttributeMap.get(key)){
            inFilterAttributeMap.set(key, newVals);
          }
          else {
            let existingValues = inFilterAttributeMap.get(key);
            let intersectionValues = existingValues.filter(value => -1 !== newVals.indexOf(value));
            if(intersectionValues.length == 0) return FALSE_RESPONSE;
            else {
              inFilterAttributeMap.set(key, intersectionValues);
            }
          }
        }
      }

      inFilterAttributeMap.forEach((values, key, map)=>{
        if(values.length == 1) {
          result.push({type:'is', attribute: key, value: values[0]});
        }else {
          result.push({type:'in', attribute: key, values: values});
        }

      });
      if(result.length === 1) return result[0];
      else return {type:'and', filters: result};
      break;
    case "in":
       if(!Array.isArray(filter.values)) {
         throw "malformed `in` throws an error";
       } else if(filter.values.length <= 0){
         return {type: 'false'};
       } else if(filter.values.length == 1) {
         return {type: 'is', attribute: filter.attribute, value: filter.values[0]};
       } else {
         filter.values = unique(filter.values);
         return filter;
       }
      break;
    case 'is':
      break;
    case 'false':
      break;
  }
  return filter;
}



module.exports = simplify;
