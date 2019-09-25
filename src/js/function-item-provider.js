/**
 * 方法提供
 */
const vscode = require("vscode")
const j = require("./j")
const jg = require("./jg")
const type = require("./type")
const keyword = require("./keyword")
const itemTool = require("./item-tool")

const j2 = require("./j2");

const { parseFunctions, parseGlobals, parseImport } = require("./jass");

/**
 * @description 是否可以提示
 * @param {vscode.TextDocument} document 
 * @param {vscode.Position} position 
 * @returns {boolean}
 */
const cantHint = (document, position) => {
  // conment string code type後
  let show = itemTool.cheakInComment(document, position) || itemTool.cheakInString(document, position) || itemTool.cheakInCode(document, position) || (function () {
    // 是否在類型後面
    let types = Object.keys(type)
    types.map(t => {
      return new RegExp(`(?<=${t}\s+)`)
    })
    return false
  })()
  return
}

/**
 * 類型
 */
const clazzs = Object.keys(type)

const types = ["boolean", "integer", "real", "string", "code", "handle"]

const clsss = [
  "agent",
  "event",
  "player",
  "widget",
  "unit",
  "destructable",
  "item",
  "ability",
  "buff",
  "force",
  "group",
  "trigger",
  "triggercondition",
  "triggeraction",
  "timer",
  "location",
  "region",
  "rect",
  "boolexpr",
  "sound",
  "conditionfunc",
  "filterfunc",
  "unitpool",
  "itempool",
  "race",
  "alliancetype",
  "racepreference",
  "gamestate",
  "igamestate",
  "fgamestate",
  "playerstate",
  "playerscore",
  "playergameresult",
  "unitstate",
  "aidifficulty",
  "eventid",
  "gameevent",
  "playerevent",
  "playerunitevent",
  "unitevent",
  "limitop",
  "widgetevent",
  "dialogevent",
  "unittype",
  "gamespeed",
  "gamedifficulty",
  "gametype",
  "mapflag",
  "mapvisibility",
  "mapsetting",
  "mapdensity",
  "mapcontrol",
  "playerslotstate",
  "volumegroup",
  "camerafield",
  "camerasetup",
  "playercolor",
  "placement",
  "startlocprio",
  "raritycontrol",
  "blendmode",
  "texmapflags",
  "effect",
  "effecttype",
  "weathereffect",
  "terraindeformation",
  "fogstate",
  "fogmodifier",
  "dialog",
  "button",
  "quest",
  "questitem",
  "defeatcondition",
  "timerdialog",
  "leaderboard",
  "multiboard",
  "multiboarditem",
  "trackable",
  "gamecache",
  "version",
  "itemtype",
  "texttag",
  "attacktype",
  "damagetype",
  "weapontype",
  "soundtype",
  "lightning",
  "pathingtype",
  "image",
  "ubersplat",
  "hashtable"]

/**
 * 判斷當前位置前一個單詞
 * @param {vscode.TextDocument} document 
 * @param {vscode.Position} position 
 * @param {string} word 
 * @returns {boolean}
 */
const matchPreviousWord = (document, position, word) => {
  if (!document || !position || !word) return false;
  if (word.length == 0) return true;
  let regexp = new RegExp(`(?<=${word.trim()}\\s+\\w*)${document.getText(new vscode.Range(position, position.with(position.line, position.character + 1)))}`)
  return false
}

/**
 * @description 是否可以提示
 * @param {vscode.TextDocument} document 
 * @param {vscode.Position} position 
 * @returns
 */
const getPre = (document, position) => {

  let items = []
  let textLine = document.lineAt(position.line)
  // 開始位置提示
  let startRanges = itemTool.findRanges(textLine, new RegExp(/^\s*\w+/))
  if (startRanges && startRanges.length > 0 && startRanges[0].contains(position)) {
    const is = ["native", "constant", "local", "set", "call", "return", "if", "elseif", "else", "endif", "function", "endfunction", "globals", "endglobals", "loop", "endloop", "exitwhen", "type"]
    is.forEach(s => {
      items.push(new vscode.CompletionItem(s, vscode.CompletionItemKind.Keyword))
    })
    clazzs.forEach(s => {
      items.push(new vscode.CompletionItem(s, vscode.CompletionItemKind.Class))
    })
    return items
  }

  // constant後面 native 或者 類型
  let nativeRanges = itemTool.findRanges(textLine, new RegExp(/(?<=constant\s+)\w+/))
  if (nativeRanges && nativeRanges.length > 0 && nativeRanges.findIndex(s => s.contains(position)) > -1) {
    items.push(new vscode.CompletionItem("native", vscode.CompletionItemKind.Class))
    clazzs.forEach(s => {
      items.push(new vscode.CompletionItem(s, vscode.CompletionItemKind.Class))
    })
    return items
  }

  // local後面 類型
  let localRanges = itemTool.findRanges(textLine, new RegExp(/(?<=local\s+)\w+/))
  if (localRanges && localRanges.length > 0 && localRanges.findIndex(s => s.contains(position)) > -1) {
    clazzs.forEach(s => {
      items.push(new vscode.CompletionItem(s, vscode.CompletionItemKind.Class))
    })
    return items
  }

  // set
  let setRanges = itemTool.findRanges(textLine, new RegExp(/(?<=set\s+)\w+/))
  if (setRanges && setRanges.length > 0 && setRanges.findIndex(s => s.contains(position)) > -1) {
    Object.keys(jg).filter(s => !jg[s].isConstant).forEach(s => {
      let variable = jg[s]
      let item = new vscode.CompletionItem(s, vscode.CompletionItemKind.Variable)
      item.detail = `${variable.name} (${variable.fileName})`
      item.documentation = new vscode.MarkdownString().appendText(variable.documentation).appendCodeblock(variable.original)
      item.insertText = variable.name
      items.push(item)
    })
    return items
  }

  // call
  let callRanges = itemTool.findRanges(textLine, new RegExp(/(?<=call\s+)\w+/))
  if (callRanges && callRanges.length > 0 && callRanges.findIndex(s => s.contains(position)) > -1) {
    Object.keys(j).forEach(s => {
      let fn = j[s]
      let item = new vscode.CompletionItem(s, vscode.CompletionItemKind.Function)
      item.detail = `${fn.name} (${fn.fileName})`
      item.documentation = new vscode.MarkdownString().appendText(fn.documentation).appendCodeblock(fn.original)
      item.insertText = fn.insertText
      items.push(item)
    })
    return items
  }

  // type name = \w
  let stateRanges = itemTool.findRanges(textLine, new RegExp(`(?<=(${clsss.join("|")})\\s+\\w+\\s*=\\s*)\\w+`))
  let stateTypeRanges = itemTool.findRanges(textLine, new RegExp(`(${clsss.join("|")})(?=\\s+\\w+\\s*=\\s*\\w+)`))
  let stateIndex = 0
  if (stateRanges && stateRanges.length > 0 && (stateIndex = stateRanges.findIndex(s => s.contains(position))) > -1) {
    let type = document.getText(stateTypeRanges[stateIndex])
    // 返回類型需一致
    Object.keys(j).filter(s => j[s].returnType == type).forEach(s => {
      let fn = j[s]
      let item = new vscode.CompletionItem(s, vscode.CompletionItemKind.Function)
      item.detail = `${fn.name} (${fn.fileName})`
      item.documentation = new vscode.MarkdownString().appendText(fn.documentation).appendCodeblock(fn.original)
      item.insertText = fn.insertText
      items.push(item)
    })
    Object.keys(jg).filter(s => jg[s].type == type).forEach(s => {
      let value = jg[s]
      let item = new vscode.CompletionItem(s, vscode.CompletionItemKind[value.isConstant ? "Constant" : "Variable"])
      item.detail = `${value.name} (${value.fileName})`
      item.documentation = new vscode.MarkdownString().appendText(value.documentation).appendCodeblock(value.original)
      item.insertText = value.insertText
      items.push(item)
    })
    items.push(new vscode.CompletionItem("null", vscode.CompletionItemKind.Keyword))
    return items
  }

  // + \w
  let pushRanges = itemTool.findRanges(textLine, new RegExp(/(?<=\+\s*)\w+/))
  if (pushRanges && pushRanges.length > 0 && pushRanges.findIndex(s => s.contains(position)) > -1) {
    // 返回類型需一致
    Object.keys(j).filter(s => {
      let returnType = j[s].returnType
      return returnType == "integer" || returnType == "real" || returnType == "string"
    }).forEach(s => {
      let fn = j[s]
      let item = new vscode.CompletionItem(s, vscode.CompletionItemKind.Function)
      item.detail = `${fn.name} (${fn.fileName})`
      item.documentation = new vscode.MarkdownString().appendText(fn.documentation).appendCodeblock(fn.original)
      item.insertText = fn.insertText
      items.push(item)
    })
    Object.keys(jg).filter(s => {
      let type = jg[s].type
      return type == "integer" || type == "real" || type == "string"
    }).forEach(s => {
      let value = jg[s]
      let item = new vscode.CompletionItem(s, vscode.CompletionItemKind[value.isConstant ? "Constant" : "Variable"])
      item.detail = `${value.name} (${value.fileName})`
      item.documentation = new vscode.MarkdownString().appendText(value.documentation).appendCodeblock(value.original)
      item.insertText = value.insertText
      items.push(item)
    })
    return items
  }

  // *-/ \w
  let msdRanges = itemTool.findRanges(textLine, new RegExp(/(?<=(\*|\-|\/)\s*)\w+/))
  if (msdRanges && msdRanges.length > 0 && msdRanges.findIndex(s => s.contains(position)) > -1) {
    // 返回類型需一致
    Object.keys(j).filter(s => {
      let returnType = j[s].returnType
      return returnType == "integer" || returnType == "real"
    }).forEach(s => {
      let fn = j[s]
      let item = new vscode.CompletionItem(s, vscode.CompletionItemKind.Function)
      item.detail = `${fn.name} (${fn.fileName})`
      item.documentation = new vscode.MarkdownString().appendText(fn.documentation).appendCodeblock(fn.original)
      item.insertText = fn.insertText
      items.push(item)
    })
    Object.keys(jg).filter(s => {
      let type = jg[s].type
      return type == "integer" || type == "real"
    }).forEach(s => {
      let value = jg[s]
      let item = new vscode.CompletionItem(s, vscode.CompletionItemKind[value.isConstant ? "Constant" : "Variable"])
      item.detail = `${value.name} (${value.fileName})`
      item.documentation = new vscode.MarkdownString().appendText(value.documentation).appendCodeblock(value.original)
      item.insertText = value.insertText
      items.push(item)
    })
    return items
  }

  // function_name(args)
  // a(b(), c)
  let takesRanges = itemTool.findRanges(textLine, new RegExp(`(?<=(takes|returns)\\s+)\\w+`))
  if (takesRanges && takesRanges.length > 0 && takesRanges.findIndex(s => s.contains(position)) > -1) {
    types.concat(clsss).forEach(s => {
      let item = new vscode.CompletionItem(s, vscode.CompletionItemKind.Class)
      item.detail = s
      item.documentation = type[s]
      item.insertText = s
      items.push(item)
    })
    items.push(new vscode.CompletionItem("nothing", vscode.CompletionItemKind.Keyword))
    return items
  }

  if (itemTool.findGlobals(document).findIndex(s => s.contains(position)) > -1 ||
    itemTool.findFunctions(document).findIndex(s => s.contains(position)) > -1) {
    // 返回類型需一致
    Object.keys(j).forEach(s => {
      let fn = j[s]
      let item = new vscode.CompletionItem(s, vscode.CompletionItemKind.Function)
      item.detail = `${fn.name} (${fn.fileName})`
      item.documentation = new vscode.MarkdownString().appendText(fn.documentation).appendCodeblock(fn.original)
      item.insertText = fn.insertText
      items.push(item)
    })
    Object.keys(jg).forEach(s => {
      let value = jg[s]
      let item = new vscode.CompletionItem(s, vscode.CompletionItemKind[value.isConstant ? "Constant" : "Variable"])
      item.detail = `${value.name} (${value.fileName})`
      item.documentation = new vscode.MarkdownString().appendText(value.documentation).appendCodeblock(value.original)
      item.insertText = value.insertText
      items.push(item)
    })



    return items
  }

  // let startRanges = itemTool.findRanges(document.lineAt(position.line), new RegExp(/^\s*\w+/))

  // for (let i = 0; i < startRanges.length; i++) {

  //   if (startRanges[i].contains(position)) {
  //     console.log(document.getText(startRanges[i]))
  //     // native constant local set call return if elseif else endif function endfunction globals endglobals loop endloop exitwhen type 基本數據類型 類
  //     const is = ["native", "constant", "local", "set", "call", "return", "if", "elseif", "else", "endif", "function", "endfunction", "globals", "endglobals", "loop", "endloop", "exitwhen", "type"]
  //     const clazzs = Object.keys(type)
  //     is.forEach(s => {
  //       items.push(new vscode.CompletionItem(s, vscode.CompletionItemKind.Keyword))
  //     })
  //     clazzs.forEach(s => {
  //       items.push(new vscode.CompletionItem(s, vscode.CompletionItemKind.Class))
  //     })
  //   }
  // }

  return items
}

/**
 * @param {vscode.TextDocument} document
 * @param {vscode.Position} postion 
 */
const position2Index = (document, postion) => {
  let index = 0;
  for (let i = 0; i < document.lineCount; i++) {
    let textLine = document.lineAt(i);
    index += textLine.character;
  }
}

/**
 * 
 * tips 0.0.3 当前能避免在字符串 注释 代号中弹出提示
 * @param {vscode.TextDocument} document 
 * @param {vscode.Position} position 
 * @param {vscode.CancellationToken} token 
 * @param {vscode.CompletionContext} context 
 * @returns {vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList>}
 */
const provideCompletionItems = (document, position, token, context) => {
  /**
   * 字符串 注释 代号 set后 type后 function定义后 takes后 returns后 constant后 array后 native
   */

  let items = []
  if (itemTool.cheakInComment(document, position) || itemTool.cheakInString(document, position) ||
    itemTool.cheakInCode(document, position)) {
    return items
  }
  getPre(document, position).forEach(s => {
    items.push(s)
  })

  try {
    let funcs = parseFunctions(document.getText());
    funcs.forEach(func => {
      let item = new vscode.CompletionItem(func.name, vscode.CompletionItemKind.Function)
      item.detail = `${func.name} (${document.fileName})`
      item.insertText = `${func.name}(${func.parameters.length > 0 ? func.parameters.map(s => s.name).join(", ") : ""})`
      items.push(item);
    })

    let globals = parseGlobals(document.getText())
    globals.forEach(global => {
      global.forEach(v => {
        const type = v.isConstant ? vscode.CompletionItemKind.Constant : vscode.CompletionItemKind.Variable;
        let item = new vscode.CompletionItem(v.name, type);
        item.detail = `${v.name} (${document.fileName})`
        items.push(item);
      })
    })

    parseImport(document).forEach(v => {
      console.log(v)
      let funcs = parseFunctions(v.content);
      funcs.forEach(func => {
        let item = new vscode.CompletionItem(func.name, vscode.CompletionItemKind.Function)
        item.detail = `${func.name} (${v.path})`;
        item.insertText = `${func.name}(${func.parameters.length > 0 ? func.parameters.map(s => s.name).join(", ") : ""})`;
        items.push(item);
      })
    })
  } catch (err) { console.log(err) }

  for (const key in j2) {
    if (j2.hasOwnProperty(key)) {
      const func = j2[key];
      let item = new vscode.CompletionItem(func.name, vscode.CompletionItemKind.Function)
      item.detail = `${func.name} (${func.fileName})`
      item.documentation = new vscode.MarkdownString().appendText(func.documentation).appendCodeblock(func.original)
      item.insertText = func.insertText
      items.push(item)
    }
  }

  return items
}

/**
 * 
 * @param {vscode.CompletionItem} item 
 * @param {vscode.CancellationToken} token 
 * @returns {vscode.ProviderResult<vscode.CompletionItem>}
 */
const resolveCompletionItem = (item, token) => {
  return item
}

module.exports = {
  provideCompletionItems, resolveCompletionItem
}
