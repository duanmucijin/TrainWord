function changeScreen(el) {
  const main = document.getElementById('mainScreen');
  const text = document.getElementById('screenText');

  main.src = el.src;

  if (el.src.includes("screen1")) {
    text.innerText = "在操作中自然接触单词";
  } else if (el.src.includes("screen2")) {
    text.innerText = "在过程中强化拼写记忆";
  } else {
    text.innerText = "在系统中形成长期积累";
  }
}