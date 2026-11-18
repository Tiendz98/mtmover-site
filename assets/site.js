
(function(){
  var h=document.querySelector('header.top'),b=document.querySelector('.burger');
  if(b)b.addEventListener('click',function(){h.classList.toggle('open')});
  var f=document.getElementById('scn');
  if(f){
    var map={
      'm365|m365':'/products/tenant-to-tenant.html',
      'imap|m365':'/products/imap-migration.html',
      'imap|imap':'/products/imap-migration.html',
      'files|m365':'/products/mailbox-tools.html',
      'm365|files':'/products/mailbox-tools.html',
      'm365|backup':'/products/backup-restore.html'
    };
    f.addEventListener('submit',function(e){
      e.preventDefault();
      var k=f.src.value+'|'+f.dst.value;
      location.href=map[k]||'/features.html';
    });
  }
})();
