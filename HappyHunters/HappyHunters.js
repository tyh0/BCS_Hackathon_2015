Tasks = new Mongo.Collection("tasks");

if (Meteor.isClient) {
  Meteor.subscribe("tasks");
  // counter starts at 0
  Session.setDefault('counter', 0);
  Session.setDefault('setRegister',false);

  Template.body.helpers({
  tasks: function () {
    if (Session.get("hideCompleted")) {
      // If hide completed is checked, filter tasks
      return Tasks.find({checked: {$ne: true}}, {sort: {createdAt: -1}});
    } else {
      // Otherwise, return all of the tasks
      return Tasks.find({}, {sort: {createdAt: -1}});
    }
  },
  hideCompleted: function () {
    return Session.get("hideCompleted");
  },
  incompleteCount: function () {
  return Tasks.find({checked: {$ne: true}}).count();
  },
      "clickedRegister": function() {
            return Session.get("setRegister");
            console.log(Session.get("setRegister"));
        }
});

  Template.body.events({
    "submit .new-task": function (event) {
      var text = event.target.text.value;
      Meteor.call("addTask", text);

      //Clear form
      event.target.text.value = "";

      //Prevent default form submit
      return false;
    },

    "change .hide-completed input": function (event) {
      Session.set("hideCompleted", event.target.checked);
    },
      
    "click .register": function(event) {
            return Session.set("setRegister",true);
            console.log("clicked register");
//            Session.set("setRegister",false);
    },
    "click .logout": function(event){
        event.preventDefault();
        Session.set("setRegister",false);
        Meteor.logout();
    }
      
  });

  Template.task.helpers({
  isOwner: function () {
    return this.owner === Meteor.userId();
  },
  "click .toggle-private": function () {
  Meteor.call("setPrivate", this._id, ! this.private);
}
});

  Template.task.events({
    // "click .toggle-checked": function(){
    //   Meteor.call("setChecked", this._id, !this.checked);
    // },
    "click .text": function(){
      //checked property is the opposite of its current value
      //Tasks.update(this._id, {$set: {checked: ! this.checked}});
      Meteor.call("setChecked", this._id, !this.checked);
    },

    "click .toggle-private": function () {
      Meteor.call("setPrivate", this._id, ! this.private);
    },
    
    "click .delete": function(){
      //Tasks.remove(this._id);
      Meteor.call("deleteTask", this._id);
    }
  });
    
    Template.register.helpers({
//        "clickedRegister": function() {
//            Session.get("setRegister");
//            console.log("setregister");
//        }
    });
    
    Template.register.events({
        "submit form": function(event) {
            event.preventDefault();
            var emailVar = event.target.registerEmail.value;
            var passwordVar = event.target.registerPassword.value;
            console.log("Form submitted.");
            
            Accounts.createUser({
            // options go here
                email: emailVar,
                password: passwordVar
            });
        }
    });
    
    Template.login.events({
    'submit form': function(event) {
        event.preventDefault();
        var emailVar = event.target.loginEmail.value;
        var passwordVar = event.target.loginPassword.value;
        
        Meteor.loginWithPassword(emailVar, passwordVar);
    }
});


  Accounts.ui.config({
  passwordSignupFields: "USERNAME_ONLY"
});
}

Meteor.methods({
  addTask: function (text) {
    // Make sure the user is logged in before inserting a task
    if (! Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

    Tasks.insert({
      text: text,
      createdAt: new Date(),
      owner: Meteor.userId(),
      username: Meteor.user().username
    });
  },
  deleteTask: function (taskId) {
    var task = Tasks.findOne(taskId);
    if (task.private && task.owner !== Meteor.userId()) {
  // If the task is private, make sure only the owner can delete it
      throw new Meteor.Error("not-authorized");
    }
    Tasks.remove(taskId);
  },
  setChecked: function (taskId, setChecked) {
    var task = Tasks.findOne(taskId);
    if (task.private && task.owner !== Meteor.userId()) {
  // If the task is private, make sure only the owner can check it off
      throw new Meteor.Error("not-authorized");
    }
    Tasks.update(taskId, { $set: { checked: setChecked} });
  },

  setPrivate: function (taskId, setToPrivate) {
  var task = Tasks.findOne(taskId);

  // Make sure only the task owner can make a task private
  if (task.owner !== Meteor.userId()) {
    throw new Meteor.Error("not-authorized");
  }

  Tasks.update(taskId, { $set: { private: setToPrivate } });
}

});

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
  Meteor.publish("tasks", function () {
  return Tasks.find({
    $or: [
      { private: {$ne: true} },
      { owner: this.userId }
    ]
  });
});
}
