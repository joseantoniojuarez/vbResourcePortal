define(['jsondiff','ojs/ojoffcanvas','knockout', 'ojs/ojkeyset'], (JsonDiffPlugin,OffcanvasUtils,ko, keySet) => {
  'use strict';
    let nextIdValue;
  class PageModule {
      
         constructor(context){

      this.selectedItems = ko.observable({
        row: new keySet.KeySetImpl(),
        column: new keySet.KeySetImpl()
      });

    }
  
    getSelectedItems() {
    return this.selectedItems;
  };


    generateBatchSnippet(url, payload, operation, id) {
      return {
        id: id ? id : "someID",
        path: url,
        operation: operation,
        payload: payload ? payload : {}
      };
    };

    createBatchPayload(usersArray,rowStatus,contractorName,contractorUserId) {
      var payloads = [];
      var record;
     
     
      Object.keys(rowStatus).forEach(key => {
        var change = rowStatus[key];
        key = parseInt(key);
       if (change === 'modified') {
          record = usersArray.find(e => e.id === key);
          record.contractorName = contractorName;
          record.contractorUserId = contractorUserId;
          record.status = 'Updated';
          delete record.id;
          payloads.push(this.generateBatchSnippet("/Users/" +
            key, record, 'update'));
        }
      
      });

      return {
        parts: payloads
      };
    };

    createBatchPayload1(usersArray,contractorName,contractorUserId) {
      var payloads = [];
      var record;
     

      usersArray.map((user)=>{

        user.contractorName = contractorName;
          user.contractorUserId = contractorUserId;
          user.status = 'Updated';
          payloads.push(this.generateBatchSnippet("/Users/" +
            user.id, user, 'update'));

      });

      return {
        parts: payloads
      };
    };

    mapToCriteria(filters,contractorid) {
    var criteria = [];
    filters.filter(f => {
      if (Array.isArray(f.value) && f.value.length > 0) {
        return true;
      } else if (typeof f.value === 'string' && f.value) {
        return true;
      } else if (typeof f.value === 'number' && f.value !== null) {
        return true;
      } else {
        return false;
      }
    }).forEach(f => {
      if (Array.isArray(f.value)) {
        var arrayCriteria = [];
        f.value.forEach(val => {
          arrayCriteria.push({
            op: '$eq',
            attribute: f.attribute,
            value: val
          })
        })
        criteria.push({
          op: '$or',
          criteria: arrayCriteria
        })
      } else if (f.value) {
        criteria.push(f)
      }
    })
    criteria.push({op: '$eq',
                   attribute: 'contractorUserId',
                   value: contractorid});
    
    return criteria;
  }
  
    getNextId(partArray) {
    
      if (nextIdValue === undefined) {
        nextIdValue = 1000000;
        partArray.forEach(e => {
          if (e.id > nextIdValue) nextIdValue = e.id;
        });
      }
      ++nextIdValue;
      return nextIdValue;
    };

    toggle() {
    const options = {
      selector: '#filterDrawer',
      content: '#mainContent',
      modality: 'modeless',
      displayMode: 'push',
      autoDismiss: 'none'
    }
    return OffcanvasUtils.toggle(options)
  };

    getRowsForIDs(table, rowIDs) {
    var index = 0;
    var result = [];
    // search only in first 1000 rows:
    while (index < 1000) {
      var row = table.getDataForVisibleRow(index);
      if (row === null) {
        return result;
      }
      const match = rowIDs.indexOf(row.data.id);
      if (match > -1) {
        rowIDs.splice(match, 1);
        result.push(row.data);
        if (rowIDs.length === 0) {
          return result;
        }
      }
      index++;
    }
    return result;
  };
   

    findData(users,key){
  
    return users.find(user=> user.Email == key.Email);
  };

  deselectAll () {
    this.selectedItems({
      row: new keySet.KeySetImpl(),
      column: new keySet.KeySetImpl()
    });
  };


    areDifferent(oldValue, newValue) {

      let JSON_DIFF = JsonDiffPlugin.create({
        arrays: {
          detectMove: false,
        },
        cloneDiffValues: false,
      });

      var diff = JSON_DIFF.diff(oldValue, newValue);
      return diff !== undefined;
    };

     removeObjectData(arg1,key) {
      delete arg1.key;
    }

  }

  return PageModule;
});
