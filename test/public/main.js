'use strict'

const btn1 = document.querySelector('#btn1');
const btn2 = document.querySelector('#btn2');

btn1.addEventListener('click', function() {
  RM.loadScript('script1.js');
});

btn2.addEventListener('click', function() {
  RM.loadScript('script2.js')
    .then(() => {
      document.querySelector('#script2-result').textContent = "I'm here!";
    })
    .catch((e) => {
      document.querySelector('#script2-result').textContent = e.message || e;
    });
});