define(['knockout','ojs/ojkeyset','vb/helpers/rest','ojs/ojpagingdataproviderview', 'ojs/ojarraydataprovider','ojs/ojoffcanvas','jsondiff'], (ko,keySet,Rest,PagingDataProviderView,ArrayDataProvider,OffcanvasUtils,JsonDiffPlugin) => {
  'use strict';
 
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

  findData(users,key){

    return users.find(user=> user.Email == key.Email);
  };
   
    deselectAll () {
    this.selectedItems({
      row: new keySet.KeySetImpl(),
      column: new keySet.KeySetImpl()
    });
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

     mapToCriteria(filters) {
       if(filters[3].value == ''){
       filters.push({
            op: '$eq',
            attribute: 'status',
            value: ['Updated','InProgress','modified']
          });
       }
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
     
    return criteria;
  };


  isSelectionEmpty(selection) {
    var row = selection.row;
    if (row.isAddAll()) {
      return false;
    } else {
      return row.values().size === 0;  
    }
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

  generateBatchSnippet(url, payload, operation, id) {
      return {
        id: id ? id : "someID",
        path: url,
        operation: operation,
        payload: payload ? payload : {}
      };
    };

  
  createBatchPayload(usersArray,rowStatus,flag) {
      var payloads = [];
      var record;
     
      if(flag == "true"){
          payloads = usersArray.map(user=>{
            let key = user.id;
            user.status = "modified";
            delete user.id;
          return this.generateBatchSnippet("/Users/" +
            key, user,'update',key);
          });

      }
      else{
      payloads = usersArray.map(user=>{
          let result = new Date();
          if(flag=="rejected"){
          user.status = "Rejected";
          user.notes = "Rejected by admin team on"+result;
          }
          else{
          user.status = "Approved";
          user.notes = "Approved by admin team on"+result;
          }
          return this.generateBatchSnippet("/Users/" +
            user.id, user, 'update',user.id);

      });
      }

      return {
        parts: payloads
      };
    };


    /**
     *
     * @param {String} arg1
     * @return {String}
     */
    async triggerImport(arg1) {

      let arrPromises = [];
     arg1.map( (item,index) => {
       let createRequest = '{ "email":"' + item.payload.Email + '", "name":"' + item.payload.Name + '","parentResourceId":"CAUSA","resourceType":"PR","language":"en","timeZone":"Pacific"}'
       var rest = Rest.get('restOfscCoreV1/putResourcesId').parameters({"id":item.payload.id}).body(createRequest).fetch();
       arrPromises.push(rest);
     });
     let finalData;
     try{
     finalData = await Promise.all(arrPromises);
     }
    catch(err) {
    console.log(`error: `, err);
    }
     return finalData;
  };

 
  assignStatus(rowData){
   rowData.status = "modified";
   return rowData;

  }


    /**
     *
     * @param {String} arg1
     * @return {String}
     */
    removeObjectData(arg1,key) {
      delete arg1.key;
    }
  }
  
  return PageModule;
});
