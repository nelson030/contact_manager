class Model {
  constructor() {
    this.contacts = [];
    this.getAllContacts().then((contacts) => {
      this.contacts = contacts;
    }).catch((msg) => this.logError(msg));
  }

  getAllContacts() {
    let self = this;
    let xhr = new XMLHttpRequest();

    xhr.open('GET', '/api/contacts');
    xhr.responseType = 'json';

    return new Promise((resolve, reject) => {
      xhr.addEventListener('loadend', function() {
        if (xhr.status === 200) {
          let contacts = xhr.response;
          self.contacts = contacts;
          resolve(contacts);
        } else {
          reject(xhr.response);
        }
      });

      xhr.send();
    });
  }

  submitNewContact(formData) {
    let self = this;

    let requestData = {
      'full_name': formData['name'],
      'email': formData['email'],
      'phone_number': formData['phone'],
      'tags': formData['tags'],
    };

    let xhr = new XMLHttpRequest();
    xhr.open('post', '/api/contacts/');
    xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');

    return new Promise((resolve, reject) => {
      xhr.addEventListener('loadend', function() {
        if (xhr.status === 200 || xhr.status === 201) {
          let newContact = JSON.parse(xhr.response);
          self.contacts.push(newContact);
          resolve(newContact);
        } else {
          reject('Error');
        }
      });

      xhr.send(JSON.stringify(requestData));
    });
  }

  updateContactChanges(formData, path) {
    let self = this;

    let data = {
      'full_name': formData['name'],
      'email': formData['email'],
      'phone_number': formData['phone'],
      'tags': formData['tags'],
    };

    let xhr = new XMLHttpRequest();
    xhr.open('put', path);
    xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');

    return new Promise((resolve, reject) => {
      xhr.addEventListener('loadend', () => {
        if (xhr.status === 200 || xhr.status === 201) {
          let updatedContact = JSON.parse(xhr.response);
          let contactIdx = self.contacts.findIndex((contact) => contact.id === updatedContact.id);
          self.contacts[contactIdx] = updatedContact;
          resolve(updatedContact);
        } else {
          reject(xhr.response);
        }
      });

      xhr.send(JSON.stringify(data));
    });
  }

  getContact(id) {
    let xhr = new XMLHttpRequest();

    xhr.open('GET', `/api/contacts/${id}`);
    xhr.responseType = 'json';

    return new Promise((resolve, reject) => {
      xhr.addEventListener('loadend', function() {
        if (xhr.status === 200) {
          let contact = xhr.response;
          resolve(contact);
        } else {
          reject(`Error`);
        }
      });

      xhr.send();
    });
  }

  deleteContact(id) {
    let self = this;

    let xhr = new XMLHttpRequest();

    xhr.open('delete', `/api/contacts/${id}`);

    return new Promise((resolve, reject) => {
      xhr.addEventListener('loadend', function() {
        if (xhr.status === 204) {
          self.contacts = self.contacts.filter((contact) => String(contact.id) !== id);
          resolve();
        } else {
          reject(xhr.response);
        }
      });

      xhr.send();
    });
  }
}

class View {
  constructor() {
    this.screen = document.querySelector('#screen');
    this.searchBarInput = document.querySelector('#searchtext');

    this.noResultMessage = null;
    this.searchResultDiv = null;

    this.parser = new DOMParser();
    this.tags = ['work', 'friend', 'family',];

    this.clearSearchArea();
  }

  clearSearchArea() {
    this.removeSearchResultDiv();
    this.removeForm();
  }

  removeSearchResultDiv() {
    if (this.searchResultDiv) {
      this.searchResultDiv.parentNode.removeChild(this.searchResultDiv);
      this.searchResultDiv = null;
    }

    if (this.noResultMessage) {
      this.noResultMessage.parentNode.removeChild(this.noResultMessage);
      this.noResultMessage = null;
    }
  }

  removeForm() {
    let form = this.screen.querySelector('#createcontactform');
    if (form) this.screen.removeChild(form);
  }

  appendCreateContactForm(contact = null) {
    let createContactTemplate = Handlebars.compile(document.querySelector('#createcontact').innerHTML);
    Handlebars.registerPartial('tagoption', document.querySelector('#tagoption').innerHTML);
    Handlebars.registerPartial('tagitem', document.querySelector('#tagitem').innerHTML);
    let parsedString;

    if (!!contact && contact['tags'] !== '') {
      let tagsArr = contact['tags'].split(',').filter((str) => (/^[a-z]+$/i).test(str));
      parsedString = createContactTemplate({
        tagOptions: this.tags,
        tags: tagsArr
      });
    } else {
      parsedString = createContactTemplate({ tagOptions: this.tags });
    }

    let htmlDoc = this.parser.parseFromString(parsedString, 'text/html');
    let form = htmlDoc.querySelector('#createcontactform');

    if (contact) this.populateContactForm(contact, form);

    this.screen.append(form);
  }

  populateContactForm(contact, form) {
    form.querySelector('input[name="name"]').value = contact['full_name'];
    form.querySelector('input[name="email"]').value = contact['email'];
    form.querySelector('input[name="phone"]').value = contact['phone_number'];
    form.querySelector('button[type="submit"]').textContent = 'Save Changes';
    form.setAttribute('data-method', 'put');
    form.action = `/api/contacts/${contact['id']}`;
  }

  getFormData() {
    let form = document.querySelector('#createcontactform');
    this.form = form;

    let name = form.querySelector('input[name="name"]').value;
    let email = form.querySelector('input[name="email"]').value;
    let phone = form.querySelector('input[name="phone"]').value;
    let tags = this.formatTags(form.querySelector('#tagslist'));

    return {
      name,
      email,
      phone,
      tags,
    };
  }

  formatTags(tagList) {
    let childCollection = tagList.children;
    let result = '';
    for (let idx = 0; idx < childCollection.length; idx += 1) {
      let tag = childCollection[idx].querySelector('p').textContent;
      if (idx === 0) {
        result = tag;
      } else {
        result += `,${tag}`;
      }
    }

    return result;
  }

  showContacts(contactList) {
    this.clearSearchArea();

    let contactsTemplate = Handlebars.compile(document.querySelector('#contactlist').innerHTML);
    let parsedString = contactsTemplate({ contacts: contactList });
    let htmlDoc = this.parser.parseFromString(parsedString, 'text/html');
    let searchResultDiv = htmlDoc.querySelector('#contactresults');
    this.searchResultDiv = searchResultDiv;

    this.screen.append(searchResultDiv);
  }

  showAlert(message) {
    alert(message);
  }

  logError(message) {
    console.error(message);
  }

  logErrors(messagesArr) {
    messagesArr.forEach((error) => this.logError(error));
  }

  resetSearchBarInput() {
    this.searchBarInput.value = '';
  }

  tagTaken() {
    let tagsList = document.querySelector('#tagslist');
    let selectedIdx = document.querySelector('#addtag').selectedIndex;
    let selectedTag = document.querySelector('#addtag').children[selectedIdx].value;

    if (tagsList.querySelector(`p[data-text="${selectedTag}"]`)) {
      return true;
    } else {
      this.selectedTag = selectedTag;
      return false;
    }
  }

  addTag() {
    let li = document.createElement('li');
    let pTag = document.createElement('p');
    let button = document.createElement('button');

    pTag.textContent = this.selectedTag;
    pTag.setAttribute('data-text', this.selectedTag);
    button.textContent = 'Remove Tag';
    button.setAttribute('data-action', 'removetag');

    li.append(pTag);
    li.append(button);
    document.querySelector('#tagslist').append(li);

    this.selectedTag = '';
  }

  removeListItem(target) {
    document.querySelector('#tagslist').removeChild(target.parentNode);
  }

  getSearchBarInput() {
    return this.searchBarInput.value.toLowerCase();
  }

  noContactFound(searchInput) {
    let message = document.createElement('h3');
    message.textContent = `No results found for "${searchInput}"`;
    this.noResultMessage = message;

    this.screen.append(message);
  }
}

class Controller {
  constructor(model, view) {
    this.model = model;
    this.view = view;

    this.formErrors = {};

    this.bindListeners();
  }

  bindListeners() {
    this.view.screen.addEventListener('click', this.userClick.bind(this));
    this.view.searchBarInput.addEventListener('keyup', this.userType.bind(this));
  }

  userClick(event) {
    event.preventDefault();

    let target = event.target;

    if (target.tagName !== 'A' && target.tagName !== 'BUTTON') return;

    let action = target.getAttribute('data-action');

    if (action === 'createcontactform') {
      this.view.clearSearchArea();
      this.view.appendCreateContactForm();
    } else if (action === 'showallcontacts') {
      this.view.clearSearchArea();
      this.showAllContacts();
    } else if (action === 'submitform') {
      event.preventDefault();

      let formData = this.view.getFormData();

      this.validNewContactData(formData);

      if (this.formErrors['name'] || this.formErrors['email'] || this.formErrors['phone']) {
        let errors = Object.values(this.formErrors).filter((errorMsg) => {
          return typeof errorMsg === 'string' && errorMsg.length > 0;
        });

        this.view.logErrors(errors);
        return;
      }

      let method = this.view.form.getAttribute('data-method');
      let path = this.view.form.getAttribute('action');

      if (method === 'post') {
        this.model.submitNewContact(formData).then((newContact) => {
          this.view.clearSearchArea();
          this.view.showContacts([newContact]);
          this.view.showAlert('Successfully created new contact!');
        }).catch((err) => this.view.logError(err));
      } else if (method === 'put') {
        this.model.updateContactChanges(formData, path).then((updatedContact) => {
          this.view.clearSearchArea();
          this.view.showContacts([updatedContact]);
          this.view.showAlert('Successfully updated contact!');
        }).catch((err) => this.view.logError(err));
      }
    } else if (action === 'clearsearch') {
      this.view.clearSearchArea();
      this.view.resetSearchBarInput();
    } else if (action === 'editcontact') {
      let id = target.getAttribute('data-contact-id');
      this.view.clearSearchArea();
      this.model.getContact(id).then((contact) => {
        this.view.appendCreateContactForm(contact);
      }).catch((err) => this.view.logError(err));
    } else if (action === 'deletecontact') {
      let id = target.getAttribute('data-contact-id');
      this.model.deleteContact(id).then(() => {
        this.view.clearSearchArea();
        this.view.showAlert('Contact deleted successfully.');
      }).catch((err) => this.view.logError(err));
    } else if (action === 'addtag') {
      if (!this.view.tagTaken()) this.view.addTag();
    } else if (action === 'removetag') {
      this.view.removeListItem(target);
    }
  }

  userType(event) {
    let key = event.key;

    if (this.invalidSearchInput(key)) {
      event.preventDefault();
      return;
    }

    this.view.removeForm();
    let searchText = this.view.getSearchBarInput();

    if (searchText.length > 0) {
      this.searchName(searchText);
    } else {
      this.view.clearSearchArea();
    }
  }

  async searchName(search) {
    let allContacts;
    if (this.model.contacts.length === 0) {
      allContacts = await this.model.getAllContacts().then((contacts) => {
        return contacts;
      }).catch((err) => this.view.logError(err));
    } else {
      allContacts = this.model.contacts;
    }

    let validContacts = allContacts.filter((contact) => {
      let lowerCaseName = contact['full_name'].toLowerCase();
      return lowerCaseName.startsWith(search);
    });

    if (validContacts.length > 0) {
      this.view.showContacts(validContacts);
    } else {
      this.view.clearSearchArea();
      this.view.noContactFound(search);
    }
  }

  showAllContacts() {
    this.model.getAllContacts().then((contacts) => {
      this.view.showContacts(contacts);
    }).catch((err) => console.error(err));
  }

  invalidSearchInput(key) {
    return !!(!(/^[a-z]$/i).test(key) &&
              key !== 'Backspace');
  }

  validNewContactData(formData) {
    let name = formData['name'];
    let email = formData['email'];
    let phone = formData['phone'];

    if (!this.validName(name)) {
      this.formErrors['name'] = 'Invalid Name.';
    } else {
      this.formErrors['name'] = null;
    }

    if (!this.validEmail(email)) {
      this.formErrors['email'] = 'Invalid Email.';
    } else {
      this.formErrors['email'] = null;
    }

    if (!this.validPhoneNumber(phone)) {
      this.formErrors['phone'] = 'Invalid Phone Number.';
    } else {
      this.formErrors['phone'] = null;
    }
  }

  validName(str) {
    return (/^[a-z\s]+$/i).test(str);
  }

  validEmail(str) {
    return (/^.+@.+$/).test(str);
  }

  validPhoneNumber(str) {
    return (/^[\d-]+$/).test(str);
  }
}

document.addEventListener('DOMContentLoaded', function() {
  let model = new Model();
  let view = new View();
  let controller = new Controller(model, view);
});