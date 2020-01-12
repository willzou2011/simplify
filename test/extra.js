const expect = require("chai").expect;
const simplify = require('../src/simplify');

describe("simplify - extra tests", function() {
  it("A multiple layers nesting `and` should become flat", function() {
    expect(simplify({
      type: 'and',
      filters: [
        { type: 'is', attribute: 'country', value: 'United States' },
        {
          type: 'and',
          filters: [
            { type: 'in', attribute: 'device', values: ['iPhone'] },
            {
              type: 'and',
              filters: [
                {type: 'in', attribute: 'city', values: ['San Jose', 'Palo Alto']},
                {type: 'is', attribute: 'street', value: 'heath street'},
                {type: 'in', attribute: 'city', values: ['San Jose', 'Mountain View']},
              ]
            }
          ]
        }
      ]
    })).to.deep.equal({
      type: 'and',
      filters: [
        { type: 'is', attribute: 'country', value: 'United States' },
        { type: 'is', attribute: 'device', value: 'iPhone' },
        { type: 'is', attribute: 'city', value: 'San Jose' },
        { type: 'is', attribute: 'street', value: 'heath street' }
      ]
    });
  });

});
