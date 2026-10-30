(() => {
  'use strict';
  const config = window.GA_SUPABASE_CONFIG || {};
  const projectUrl = String(config.url || '').trim();
  const publicKey = String(config.anonKey || config.publishableKey || '').trim();
  const client = projectUrl && publicKey && window.supabase?.createClient
    ? window.supabase.createClient(projectUrl, publicKey, {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}})
    : null;
  const avatars = [{id:'star',icon:'✦'},{id:'wave',icon:'≈'},{id:'compass',icon:'◈'},{id:'sun',icon:'☼'},{id:'leaf',icon:'♧'},{id:'moon',icon:'☾'},{id:'shell',icon:'❋'},{id:'anchor',icon:'⚓'}];
  const rarities = ['common','expensive','extravagant','exquisite'];
  let authMode = 'signin', selectedAvatar = 'star', targetPlayer = null, pendingFactor = null, notice = '', noticeIsError = false, viewToken = 0;

  const node = (tag, attrs={}, children=[]) => {
    const result = document.createElement(tag);
    for (const [key,value] of Object.entries(attrs)) {
      if (key === 'class') result.className = value;
      else if (key === 'text') result.textContent = value;
      else if (key.startsWith('on') && typeof value === 'function') result.addEventListener(key.slice(2).toLowerCase(),value);
      else if (typeof value === 'boolean' && !key.startsWith('aria-')) { if (value) result.setAttribute(key,''); }
      else if (value !== null && value !== undefined) result.setAttribute(key,String(value));
    }
    for (const child of Array.isArray(children)?children:[children]) if (child !== null && child !== undefined) result.append(child instanceof Node?child:document.createTextNode(String(child)));
    return result;
  };
  const pageHeader = () => node('div',{class:'page-head'},node('div',{},[
    node('div',{class:'eyebrow',text:'Player account'}),
    node('h1',{class:'title',text:'Accounts & trading'}),
    node('p',{class:'subtitle',text:'Create a public player profile, open online packs, and offer cards to other players.'})
  ]));
  const cardName = id => window.GlasswakeAtlas?.catalog?.find(card=>card.id===id)?.name || id;
  const noticeNode = () => notice ? node('div',{class:`account-notice ${noticeIsError?'account-error':''}`,role:'status',text:notice}) : null;
  const setNotice = (message,isError=false) => { notice=message; noticeIsError=isError; };
  const label = (text,control) => node('label',{},[node('span',{text}),control]);
  const input = (type,name,placeholder,extra={}) => {
    const el=node('input',{type,name,placeholder,...extra});
    return el;
  };
  const button = (text,action,kind='btn') => node('button',{type:'button',class:kind,onclick:action,text});

  function setupNotice(){
    const panel=node('section',{class:'panel account-panel'},[
      node('div',{class:'eyebrow',text:'Online features'}),
      node('h2',{text:'Backend setup needed'}),
      node('p',{class:'account-subtitle',text:'The game remains playable without an account backend. To enable sign-in and trading, configure a Supabase project and apply the database migration.'}),
      node('p',{class:'account-help',text:'Add the project URL and anon/publishable key to backend-config.js, then run the account/trading migration followed by the reverse-holo migration in the Supabase SQL Editor. Never put a service_role key in browser code.'})
    ]);
    return node('div',{class:'account-page'},[pageHeader(),panel]);
  }

  function authView(){
    const registering=authMode==='signup';
    const form=node('form',{class:'account-form'});
    if(registering){
      const username=input('text','username','3–20 letters, numbers, or underscores',{minlength:'3',maxlength:'20',pattern:'[A-Za-z0-9_]{3,20}',autocomplete:'username',required:true});
      form.append(label('Public username',username));
      const display=input('text','display_name','How other players see you',{maxlength:'32',required:true});
      form.append(label('Display name',display));
      const avatarPicker=node('div',{class:'account-avatar-grid',role:'group','aria-label':'Choose an avatar'},avatars.map(avatar=>node('button',{type:'button',class:`account-avatar ${selectedAvatar===avatar.id?'selected':''}`,'aria-label':`${avatar.id} avatar`,'aria-pressed':selectedAvatar===avatar.id,onclick:()=>{selectedAvatar=avatar.id;renderAccount(document.querySelector('#app'))},text:avatar.icon})));
      form.append(label('Avatar',avatarPicker));
    }
    const email=input('email','email','you@example.com',{autocomplete:'email',required:true});
    const password=input('password','password',registering?'At least 10 characters':'Your password',{autocomplete:registering?'new-password':'current-password',minlength:registering?'10':undefined,required:true});
    form.append(label('Email',email),label('Password',password));
    form.append(node('button',{class:'btn primary',type:'submit',text:registering?'Create account':'Sign in'}));
    form.addEventListener('submit',async event=>{
      event.preventDefault();
      const values=new FormData(form), mail=String(values.get('email')||'').trim(), pass=String(values.get('password')||'');
      setNotice('Contacting the account service…'); renderAccount(document.querySelector('#app'));
      try{
        if(registering){
          const username=String(values.get('username')||'').trim().toLowerCase(), displayName=String(values.get('display_name')||'').trim();
          if(!/^[a-z0-9_]{3,20}$/.test(username))throw new Error('Username must be 3–20 letters, numbers, or underscores.');
          const {data,error}=await client.auth.signUp({email:mail,password:pass,options:{data:{username,display_name:displayName,avatar_id:selectedAvatar}}});
          if(error)throw error;
          if(!data.session){setNotice('Account created. Check your email to confirm it, then sign in.');authMode='signin';renderAccount(document.querySelector('#app'));return;}
        } else {
          const {error}=await client.auth.signInWithPassword({email:mail,password:pass});
          if(error)throw error;
        }
        setNotice(''); await renderAccount(document.querySelector('#app'));
      }catch(error){setNotice(error.message||'Could not complete account request.',true);await renderAccount(document.querySelector('#app'));}
    });
    const toggle=button(registering?'Already have an account? Sign in':'New here? Create an account',()=>{authMode=registering?'signin':'signup';setNotice('');renderAccount(document.querySelector('#app'))},'btn ghost');
    const panel=node('section',{class:'panel account-panel'},[
      node('div',{class:'eyebrow',text:registering?'New chartmaker':'Welcome back'}),
      node('h2',{text:registering?'Create your account':'Sign in'}),
      node('p',{class:'account-help',text:'Your email is used for sign-in and account recovery; it is not shown on your public player profile. Card inventory and trades are stored in the connected game database.'}),
      form,toggle
    ]);
    return node('div',{class:'account-page'},[pageHeader(),noticeNode(),panel].filter(Boolean));
  }

  function variantLabel(item){return `${item.rarity}${item.reverse_holo?' · reverse holo':item.foil?' · foil':''}`;}
  function inventoryKey(item){return `${item.card_id}|${item.rarity}|${item.foil?'1':'0'}|${item.reverse_holo?'1':'0'}`;}
  function parseInventoryKey(value){const [card_id,rarity,foil,reverse_holo]=String(value).split('|');return {card_id,rarity,foil:foil==='1',reverse_holo:reverse_holo==='1'};}
  function makeVariantSelect(name){return node('select',{name},rarities.map(rarity=>node('option',{value:rarity,text:rarity[0].toUpperCase()+rarity.slice(1)})));}

  async function mfaChallengeView(root,session,token){
    const {data,error}=await client.auth.mfa.listFactors();if(error)throw error;
    const factor=(data?.totp||[]).find(item=>item.status==='verified');
    if(!factor)throw new Error('Two-factor sign-in is required, but no verified authenticator was found.');
    const form=node('form',{class:'account-form account-panel'},[
      node('div',{class:'eyebrow',text:'Collection protection'}),node('h2',{text:'Verify your authenticator'}),
      node('p',{class:'account-help',text:'Enter the current six-digit code from your authenticator app to unlock your online collection.'}),
      label('Authenticator code',input('text','code','123456',{inputmode:'numeric',autocomplete:'one-time-code',pattern:'[0-9]{6}',maxlength:'6',required:true})),
      node('button',{class:'btn primary',type:'submit',text:'Verify and continue'})
    ]);
    form.addEventListener('submit',async event=>{event.preventDefault();try{const {data:challenge,error:challengeError}=await client.auth.mfa.challenge({factorId:factor.id});if(challengeError)throw challengeError;const {error:verifyError}=await client.auth.mfa.verify({factorId:factor.id,challengeId:challenge.id,code:String(new FormData(form).get('code')||'')});if(verifyError)throw verifyError;setNotice('Authenticator verified.');await renderAccount(root);}catch(error){setNotice(error.message||'Could not verify the authenticator.',true);await renderAccount(root);}});
    if(token===viewToken)root.replaceChildren(node('div',{class:'account-page'},[pageHeader(),noticeNode(),form].filter(Boolean)));
  }

  function tradeLine(side,inventory,cards){
    const cardOptions=side==='offered'?inventory.map(item=>node('option',{value:inventoryKey(item),text:`${cardName(item.card_id)} · ${variantLabel(item)} (have ${item.quantity})`})):cards.map(card=>node('option',{value:card.id,text:card.name}));
    const card=node('select',{class:'trade-card',required:true},cardOptions);
    const rarity=side==='offered'?null:makeVariantSelect('rarity');
    const foil=side==='offered'?null:node('label',{class:'trade-flag'},[node('input',{type:'checkbox',class:'trade-foil','aria-label':'Foil'}),node('span',{text:'Foil'})]);
    const reverseHolo=side==='offered'?null:node('label',{class:'trade-flag'},[node('input',{type:'checkbox',class:'trade-reverse-holo','aria-label':'Reverse holo'}),node('span',{text:'Reverse holo'})]);
    const quantity=input('number','quantity','Qty',{class:'trade-quantity',min:'1',max:'10000',value:'1',required:true});
    const row=node('div',{class:'trade-line'},[card,rarity,foil,reverseHolo,quantity]);
    return row;
  }

  async function mfaSettingsPanel(root){
    const {data,error}=await client.auth.mfa.listFactors();if(error)throw error;
    const factor=(data?.totp||[]).find(item=>item.status==='verified');
    const panel=node('section',{class:'panel account-panel'},[node('div',{class:'eyebrow',text:'Account security'}),node('h2',{text:'Two-factor authentication'}),node('p',{class:'account-help',text:'Use an authenticator app for a second sign-in step. When enabled, the database also requires a verified second factor to read your online collection and trade offers.'})]);
    if(factor){
      panel.append(node('p',{class:'account-notice',text:'Authenticator app is enabled.'}));
      panel.append(button('Turn off two-factor authentication',async()=>{try{const {data:challenge,error:challengeError}=await client.auth.mfa.challenge({factorId:factor.id});if(challengeError)throw challengeError;const code=prompt('Enter the current authenticator code to turn off two-factor authentication:');if(!code)return;const {error:verifyError}=await client.auth.mfa.verify({factorId:factor.id,challengeId:challenge.id,code});if(verifyError)throw verifyError;const {error:removeError}=await client.auth.mfa.unenroll({factorId:factor.id});if(removeError)throw removeError;await client.auth.refreshSession();setNotice('Two-factor authentication turned off.');await renderAccount(root);}catch(err){setNotice(err.message||'Could not turn off two-factor authentication.',true);await renderAccount(root);}},'btn'));
    }else if(pendingFactor){
      const qr=node('img',{src:pendingFactor.totp.qr_code,alt:'Authenticator setup QR code',class:'mfa-qr'});
      const form=node('form',{class:'account-form'},[qr,node('p',{class:'account-help',text:`If scanning is unavailable, enter this setup key in your authenticator app: ${pendingFactor.totp.secret}`}),label('Current authenticator code',input('text','code','123456',{inputmode:'numeric',autocomplete:'one-time-code',pattern:'[0-9]{6}',maxlength:'6',required:true})),node('button',{class:'btn primary',type:'submit',text:'Verify and enable'})]);
      form.addEventListener('submit',async event=>{event.preventDefault();try{const {data:challenge,error:challengeError}=await client.auth.mfa.challenge({factorId:pendingFactor.id});if(challengeError)throw challengeError;const {error:verifyError}=await client.auth.mfa.verify({factorId:pendingFactor.id,challengeId:challenge.id,code:String(new FormData(form).get('code')||'')});if(verifyError)throw verifyError;pendingFactor=null;setNotice('Two-factor authentication enabled.');await renderAccount(root);}catch(err){setNotice(err.message||'Could not verify this authenticator.',true);await renderAccount(root);}});
      panel.append(form);
    }else panel.append(button('Set up authenticator app',async()=>{try{const {data,error:enrollError}=await client.auth.mfa.enroll({factorType:'totp',friendlyName:'God Gathering'});if(enrollError)throw enrollError;pendingFactor=data;setNotice('Scan the QR code and verify a current code to finish setup.');await renderAccount(root);}catch(err){setNotice(err.message||'Could not start authenticator setup.',true);await renderAccount(root);}},'btn primary'));
    return panel;
  }

  async function authenticatedView(root,session,token){
    const user=session.user;
    const {data:aalData,error:aalError}=await client.auth.mfa.getAuthenticatorAssuranceLevel();if(aalError)throw aalError;
    if(aalData.nextLevel==='aal2'&&aalData.currentLevel!=='aal2'){await mfaChallengeView(root,session,token);return;}
    const [profileResult,walletResult,inventoryResult,tradeResult]=await Promise.all([
      client.from('player_profiles').select('user_id,username,display_name,avatar_id,created_at').eq('user_id',user.id).single(),
      client.from('player_wallets').select('marks').eq('user_id',user.id).single(),
      client.from('player_inventory').select('card_id,rarity,foil,reverse_holo,quantity').eq('user_id',user.id).order('card_id'),
      client.from('trade_offers').select('id,sender_user_id,recipient_user_id,status,created_at,expires_at,trade_offer_items(side,card_id,rarity,foil,reverse_holo,quantity)').or(`sender_user_id.eq.${user.id},recipient_user_id.eq.${user.id}`).order('created_at',{ascending:false}).limit(30)
    ]);
    if(token!==viewToken)return;
    for(const result of [profileResult,walletResult,inventoryResult,tradeResult])if(result.error)throw result.error;
    const profile=profileResult.data,wallet=walletResult.data,inventory=inventoryResult.data||[],trades=tradeResult.data||[];
    const peerIds=[...new Set(trades.map(trade=>trade.sender_user_id===user.id?trade.recipient_user_id:trade.sender_user_id))];
    let peerMap=new Map();
    if(peerIds.length){const peers=await client.rpc('get_public_profiles',{p_user_ids:peerIds});if(peers.error)throw peers.error;peerMap=new Map((peers.data||[]).map(peer=>[peer.user_id,peer]));}
    if(token!==viewToken)return;
    const inventoryRows=inventory.length?inventory.map(item=>node('div',{class:'inventory-item'},[
      node('span',{},[node('b',{text:cardName(item.card_id)}),node('small',{text:`${item.card_id} · ${variantLabel(item)}`})]),node('b',{text:`×${item.quantity}`})
    ])):node('p',{class:'account-empty',text:'No online cards yet. Open an online pack to add cards to this tradeable binder.'});
    const cards=window.GlasswakeAtlas?.catalog||[];
    const avatar=avatars.find(item=>item.id===profile.avatar_id)?.icon||'✦';
    const profileForm=node('form',{class:'account-form account-panel profile-form'},[
      node('div',{class:'eyebrow',text:'Public player card'}),
      node('div',{class:'account-row'},[node('span',{class:'avatar-chip',text:avatar}),node('div',{},[node('b',{text:profile.display_name}),node('small',{class:'account-help',text:`@${profile.username}`})])]),
      label('Username',input('text','username',profile.username,{value:profile.username,minlength:'3',maxlength:'20',pattern:'[A-Za-z0-9_]{3,20}',required:true})),
      label('Display name',input('text','display_name',profile.display_name,{value:profile.display_name,maxlength:'32',required:true}))
    ]);
    let profileAvatar=profile.avatar_id;
    const profileAvatarPicker=node('div',{class:'account-avatar-grid',role:'group','aria-label':'Choose an avatar'},avatars.map(item=>node('button',{type:'button',class:`account-avatar ${profileAvatar===item.id?'selected':''}`, 'aria-label':`${item.id} avatar`,'aria-pressed':profileAvatar===item.id,onclick:()=>{profileAvatar=item.id;profileAvatarPicker.replaceChildren(...avatars.map(next=>node('button',{type:'button',class:`account-avatar ${profileAvatar===next.id?'selected':''}`,'aria-label':`${next.id} avatar`,'aria-pressed':profileAvatar===next.id,onclick:()=>{profileAvatar=next.id;renderAccount(root)},text:next.icon})))},text:item.icon})));
    profileForm.append(label('Avatar',profileAvatarPicker),node('button',{class:'btn',type:'submit',text:'Save profile'}));
    profileForm.addEventListener('submit',async event=>{event.preventDefault();const values=new FormData(profileForm);try{const {error}=await client.rpc('update_player_profile',{p_username:String(values.get('username')||'').trim().toLowerCase(),p_display_name:String(values.get('display_name')||'').trim(),p_avatar_id:profileAvatar});if(error)throw error;setNotice('Profile saved.');await renderAccount(root);}catch(error){setNotice(error.message||'Could not save profile.',true);await renderAccount(root);}});
    const packPanel=node('section',{class:'panel account-panel'},[
      node('div',{class:'eyebrow',text:'Online binder'}),node('h2',{text:'Your tradeable collection'}),node('p',{class:'account-subtitle',text:'This online binder is separate from the device-only collection. Reverse-holo prints are tracked separately from foils; build a Duel deck from playable cards in this binder.'}),
      node('div',{class:'account-row'},[node('b',{text:`${wallet.marks} online marks`}),button('Open an online pack · 100 marks',async()=>{try{setNotice('Opening pack…');await renderAccount(root);const {data,error}=await client.rpc('open_online_pack');if(error)throw error;const pulled=(data||[]).map(item=>`${cardName(item.card_id)} · ${variantLabel(item)}`);setNotice(`Online pack opened: ${pulled.join(' | ')}`);await renderAccount(root);}catch(error){setNotice(error.message||'Could not open an online pack.',true);await renderAccount(root);}},'btn primary')])
    ]);
    const targetBox=node('div',{class:'account-row'},[input('text','recipient_username','Find a username',{autocomplete:'off',minlength:'3',maxlength:'20'}),button('Find player',async()=>{const field=targetBox.querySelector('input');const query=field.value.trim();if(!query){setNotice('Enter a player username first.',true);await renderAccount(root);return;}try{const {data,error}=await client.rpc('find_player',{p_username:query});if(error)throw error;targetPlayer=data?.[0]||null;setNotice(targetPlayer?`Found ${targetPlayer.display_name} (@${targetPlayer.username}).`: 'No player found for that username.',!targetPlayer);await renderAccount(root);}catch(error){setNotice(error.message||'Could not search players.',true);await renderAccount(root);}},'btn')]);
    const offeredLines=node('div',{class:'trade-lines'},[tradeLine('offered',inventory,cards)]),requestedLines=node('div',{class:'trade-lines'},[tradeLine('requested',inventory,cards)]);
    const addLine=(container,side)=>{if(container.children.length>=50)return;container.append(tradeLine(side,inventory,cards));};
    const tradeForm=node('form',{class:'account-form'},[
      node('b',{text:'You offer'}),offeredLines,button('Add another offered card',()=>addLine(offeredLines,'offered'),'btn ghost'),
      node('b',{text:'You request'}),requestedLines,button('Add another requested card',()=>addLine(requestedLines,'requested'),'btn ghost'),
      node('button',{class:'btn primary',type:'submit',disabled:!inventory.length||!targetPlayer,text:targetPlayer?`Offer cards to @${targetPlayer.username}`:'Find a player first'})
    ]);
    tradeForm.addEventListener('submit',async event=>{event.preventDefault();if(!targetPlayer)return;const readLines=(container,side)=>[...container.children].map(row=>{const card=row.querySelector('.trade-card').value,n=Number(row.querySelector('.trade-quantity').value);const variant=side==='offered'?parseInventoryKey(card):{card_id:card,rarity:row.querySelector('select[name="rarity"]').value,foil:row.querySelector('.trade-foil').checked,reverse_holo:row.querySelector('.trade-reverse-holo').checked};return {...variant,quantity:n};});try{const offered=readLines(offeredLines,'offered'),requested=readLines(requestedLines,'requested');if([...offered,...requested].some(item=>!Number.isInteger(item.quantity)||item.quantity<1||item.quantity>10000))throw new Error('Card quantities must be whole numbers from 1 to 10,000.');if([...offered,...requested].some(item=>item.foil&&item.reverse_holo))throw new Error('Choose either foil or reverse holo for each card.');const {error}=await client.rpc('create_trade_offer',{p_recipient_username:targetPlayer.username,p_offered_items:offered,p_requested_items:requested});if(error)throw error;targetPlayer=null;setNotice('Bundle offer sent. Offered cards are held while it is pending and returned if declined or cancelled.');await renderAccount(root);}catch(error){setNotice(error.message||'Could not create the offer.',true);await renderAccount(root);}});
    const tradePanel=node('section',{class:'panel account-panel'},[node('div',{class:'eyebrow',text:'Player exchange'}),node('h2',{text:'Offer card bundles'}),node('p',{class:'account-subtitle',text:'Trade one card for several cards, several for one, or any other bundle. Your offered cards are held safely while the offer is pending.'}),targetBox,targetPlayer?node('div',{class:'account-notice',text:`Trading with ${targetPlayer.display_name} (@${targetPlayer.username})`}):null,tradeForm]);
    const tradeRows=trades.length?trades.map(trade=>{
      const incoming=trade.recipient_user_id===user.id, peer=peerMap.get(incoming?trade.sender_user_id:trade.recipient_user_id),status=trade.status;
      const bundleText=side=>trade.trade_offer_items.filter(item=>item.side===side).map(item=>`${item.quantity} × ${cardName(item.card_id)} (${item.rarity}${item.reverse_holo?' reverse holo':item.foil?' foil':''})`).join(', ');
      const details=incoming?`${peer?.display_name||'Player'} offers ${bundleText('offered')} for your ${bundleText('requested')}.`:`Offer to ${peer?.display_name||'player'}: ${bundleText('offered')} for ${bundleText('requested')}.`;
      const row=node('div',{class:'trade-item'},[node('span',{},[node('b',{text:status==='pending'?(incoming?'Incoming offer':'Outgoing offer'):`Trade ${status}`}),node('small',{text:details})])]);
      if(status==='pending'){
        const actions=node('div',{class:'trade-actions'});
        const resolve=async action=>{try{const {error}=await client.rpc('resolve_trade_offer',{p_offer_id:trade.id,p_action:action});if(error)throw error;setNotice(action==='accept'?'Trade accepted. Cards moved between binders.':`Offer ${action}ed.`);await renderAccount(root);}catch(error){setNotice(error.message||'Could not resolve the trade.',true);await renderAccount(root);}};
        if(incoming)actions.append(button('Accept',()=>resolve('accept'),'btn primary'),button('Decline',()=>resolve('decline'),'btn'));
        else actions.append(button('Cancel',()=>resolve('cancel'),'btn'));
        row.append(actions);
      }
      return row;
    }):node('p',{class:'account-empty',text:'No trade offers yet.'});
    const offersPanel=node('section',{class:'panel account-panel'},[node('div',{class:'eyebrow',text:'Offers'}),node('h2',{text:'Trade inbox'}),node('div',{class:'trade-list'},tradeRows)]);
    const header=node('div',{class:'account-heading'},[node('div',{},[node('div',{class:'eyebrow',text:'Signed in'}),node('h1',{class:'title',text:profile.display_name}),node('p',{class:'subtitle',text:`@${profile.username} · Email is private`})]),button('Sign out',async()=>{await client.auth.signOut();targetPlayer=null;setNotice('');await renderAccount(root)},'btn')]);
    const walletPanel=node('section',{class:'panel account-panel'},[node('div',{class:'eyebrow',text:'Account balance'}),node('h2',{text:`${wallet.marks} marks`}),node('p',{class:'account-help',text:'Online marks and cards are server-managed. Offline game progress stays on this device.'})]);
    const inventoryPanel=node('section',{class:'panel account-panel'},[node('div',{class:'eyebrow',text:'Binder'}),node('h2',{text:`${inventory.reduce((sum,item)=>sum+item.quantity,0)} online cards`}),node('div',{class:'inventory-list'},inventoryRows)]);
    const securityPanel=await mfaSettingsPanel(root);
    root.replaceChildren(node('div',{class:'account-page'},[pageHeader(),noticeNode(),node('div',{class:'account-grid'},[profileForm,node('div',{class:'account-page'},[walletPanel,packPanel])]),node('div',{class:'account-grid'},[inventoryPanel,tradePanel]),offersPanel,securityPanel].filter(Boolean)));
  }

  async function renderAccount(root){
    if(!root)return;
    const token=++viewToken;
    if(!projectUrl||!publicKey){root.replaceChildren(setupNotice());return;}
    if(!client){root.replaceChildren(node('div',{class:'account-page'},[pageHeader(),node('section',{class:'panel account-panel account-notice account-error',text:'The Supabase client did not load. The game still works offline; account features need an internet connection.'})]));return;}
    root.replaceChildren(node('div',{class:'account-page'},[pageHeader(),node('section',{class:'panel account-panel',text:'Loading account…'})]));
    try{
      const {data,error}=await client.auth.getSession();if(error)throw error;if(token!==viewToken)return;
      if(data.session)await authenticatedView(root,data.session,token);
      else root.replaceChildren(authView());
    }catch(error){if(token!==viewToken)return;root.replaceChildren(node('div',{class:'account-page'},[pageHeader(),noticeNode(),node('section',{class:'panel account-panel account-notice account-error',text:error.message||'Account service unavailable.'})].filter(Boolean)));}
  }
  function showStartupAccountPrompt(){
    if(!client)return;
    try{if(localStorage.getItem('god-gathering-account-prompt-dismissed')==='1')return;}catch{}
    client.auth.getSession().then(({data,error})=>{
      if(error||data?.session||document.querySelector('.startup-account-backdrop'))return;
      const backdrop=node('div',{class:'startup-account-backdrop',role:'presentation'});
      const openAccount=async mode=>{
        try{localStorage.setItem('god-gathering-account-prompt-dismissed','1');}catch{}
        authMode=mode;setNotice('');backdrop.remove();
        document.querySelector('[data-view="account"]')?.click();
        await renderAccount(document.querySelector('#app'));
      };
      const dismiss=()=>{try{localStorage.setItem('god-gathering-account-prompt-dismissed','1');}catch{}backdrop.remove();};
      backdrop.append(node('section',{class:'panel startup-account-prompt',role:'dialog','aria-modal':'true','aria-labelledby':'startup-account-title'},[
        node('div',{class:'eyebrow',text:'Welcome to God Gathering'}),
        node('h2',{id:'startup-account-title',text:'Create your player account'}),
        node('p',{class:'account-help',text:'Sign up with your email to protect your online collection and trade cards. Your email is used to sign in and is never shown on your public profile.'}),
        node('p',{class:'account-help',text:'You can continue offline without an account: view your collection, buy booster packs, and unlock table palettes with marks. That progress and those purchases stay on this device.'}),
        node('div',{class:'startup-account-actions'},[
          button('Create account with email',()=>openAccount('signup'),'btn primary'),
          button('I already have an account',()=>openAccount('signin'),'btn'),
          button('Continue offline',dismiss,'btn ghost')
        ])
      ]));
      document.body.append(backdrop);
    }).catch(()=>{});
  }
  async function loadOnlineInventory(){
    if(!client)throw new Error('Account service is not configured.');
    const {data:sessionData,error:sessionError}=await client.auth.getSession();if(sessionError)throw sessionError;
    if(!sessionData.session)throw new Error('Sign in from Account & Trade before building a deck from your binder.');
    const {data:aal,error:aalError}=await client.auth.mfa.getAuthenticatorAssuranceLevel();if(aalError)throw aalError;
    if(aal.nextLevel==='aal2'&&aal.currentLevel!=='aal2')throw new Error('Open Account & Trade and verify your authenticator before using your collection.');
    const {data,error}=await client.from('player_inventory').select('card_id,rarity,foil,reverse_holo,quantity').eq('user_id',sessionData.session.user.id).order('card_id');
    if(error)throw error;
    return data||[];
  }
  window.GlasswakeAtlas = window.GlasswakeAtlas || {};
  window.GlasswakeAtlas.renderAccount = renderAccount;
  window.GlasswakeAtlas.loadOnlineInventory = loadOnlineInventory;
  window.GlasswakeAtlas.showStartupAccountPrompt = showStartupAccountPrompt;
  setTimeout(showStartupAccountPrompt,0);
})();
