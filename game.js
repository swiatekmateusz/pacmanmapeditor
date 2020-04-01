class Game {
  constructor(mapWidth = 25, mapHeight = 25) {
    this.x = mapWidth
    this.y = mapHeight
    this.spriteX = 35
    this.spriteY = 35
    this.mapFields = []
    this.automat = false
    this.focusFields = []
    this.undoMoves = []
    this.redoMoves = []
    this.help = []
    this.generate()
  }

  clearFields = () => {
    this.focusFields = []
    document.querySelectorAll('.selected').forEach(field => {
      field.classList.remove('selected')
    })
  }

  fillFields = (x, y) => {
    const automat = document.querySelector('input[type=checkbox]').checked
    let maxX = 0
    let maxY = 0
    const X = []
    const changes = []
    this.focusFields.forEach(field => {
      const div = document.querySelector(`.map-side [data-x="${field.x}"][data-y="${field.y}"]`)
      if (field.y > maxY) {
        maxY = field.y
        maxX = field.x
      } else if (field.y === maxY) {
        X.push(field.x)
      }
      maxX = Math.max(...X) > maxX ? Math.max(...X) : maxX
      changes.push({
        x: field.x,
        y: field.y,
        bgi: div.style.backgroundImage,
        bgp: div.style.backgroundPosition
      })
      div.style.backgroundImage = 'url("./sprite.png")'
      div.style.backgroundPosition = `${-this.spriteX * x - x - 2}px ${-this.spriteY * y - y - 2}px`
    })
    if (changes.length) this.undoMoves.push(changes)
    this.clearFields()
    if (automat) {
      let x = 0
      let y = maxY
      if (maxX + 1 !== this.x + 10) {
        x = maxX + 1
      } else {
        x = 10
        y = y + 1 === this.y + 10 ? y : y + 1
      }
      const div = document.querySelector(`.map-side [data-x="${x}"][data-y="${y}"]`)
      this.focusFields.push({ x, y })
      div.classList.add('selected')
    }
  }

  selectFields = (x1, y1, x2, y2, isCtrl, e) => {
    this.help.forEach(field => {
      const div = document.querySelector(`.map-side [data-x="${field.x}"][data-y="${field.y}"]`)
      div.classList.remove('selected')
    })
    this.focusFields.forEach(field => {
      const div = document.querySelector(`.map-side [data-x="${field.x}"][data-y="${field.y}"]`)
      div.classList.add('selected')
    })
    this.help = []
    if (x1 > x2) {
      x1 = [x2, x2 = x1][0];
    }
    if (y1 > y2) {
      y1 = [y2, y2 = y1][0];
    }
    if (!isCtrl) this.clearFields()
    const howManyX = Math.abs(x1 - x2)
    const howManyY = Math.abs(y1 - y2)
    const fromX = parseInt(x1)
    const fromY = parseInt(y1)
    for (let y = 0; y <= howManyY; y++) {
      for (let x = 0; x <= howManyX; x++) {
        const div = document.querySelector(`.map-side [data-x="${fromX + x}"][data-y="${fromY + y}"]`)
        if (e === "mouseup") {
          if (isCtrl && div.classList.contains('selected')) {
            div.classList.remove('selected')
            const index = this.focusFields.findIndex(field => field.x === fromX + x && field.y === fromY + y)
            this.focusFields.splice(index, 1)
          } else {
            this.focusFields.push({ x: fromX + x, y: fromY + y })
            div.classList.add('selected')
          }
        } else {
          this.help.push({ x: fromX + x, y: fromY + y })
          div.classList.add('selected')
        }

      }
    }
  }

  generate = () => {
    const overlay = document.querySelector('.overlay')
    document.querySelector('body').addEventListener('contextmenu', function (e) {
      e.preventDefault()
      overlay.classList.add('active')
    })
    overlay.addEventListener('click', function () {
      this.classList.remove('active')
    })

    const spriteSide = document.querySelector('.sprite-side')
    for (let y = 0; y < 40; y++) {
      for (let x = 0; x < 16; x++) {
        const div = document.createElement('div')
        div.setAttribute('data-x', x)
        div.setAttribute('data-y', y)
        div.classList.add('spriteItem')
        div.style.backgroundImage = 'url("./sprite.png")'
        div.style.backgroundPosition = `${-this.spriteX * x - x - 1}px ${-this.spriteY * y - y - 1}px`
        div.addEventListener('mouseover', function () {
          this.classList.add('target')
        })
        div.addEventListener('mouseout', function () {
          this.classList.remove('target')
        })
        div.addEventListener('click', e => {
          const { x, y } = e.target.dataset
          this.fillFields(x, y)
        })
        spriteSide.appendChild(div)
      }
    }
    const mapSide = document.querySelector('.map-side')
    mapSide.style.width = `${37 * this.x}px`
    for (let y = 0; y < this.y; y++) {
      for (let x = 0; x < this.x; x++) {
        const div = document.createElement('div')
        div.setAttribute('data-x', x + 10)
        div.setAttribute('data-y', y + 10)
        div.classList.add('mapItem')
        div.addEventListener('mouseover', function () {
          this.classList.add('target')
        })
        div.addEventListener('mouseout', function () {
          this.classList.remove('target')
        })
        mapSide.appendChild(div)
      }
    }

    mapSide.addEventListener('mousedown', e => {
      const box = document.querySelector('.box')
      let { pageX, pageY } = e
      box.style.top = pageY + "px"
      box.style.left = pageX + "px"
      e.preventDefault()
      if (e.which === 1) {
        const { x: x1, y: y1 } = e.target.dataset
        const onMouseup = (e) => {
          const { x: x2, y: y2 } = e.target.dataset
          this.selectFields(x1, y1, x2, y2, e.ctrlKey, 'mouseup')
          box.style.height = "0px"
          box.style.width = "0px"
          mapSide.removeEventListener('mouseup', onMouseup)
          mapSide.removeEventListener('mousemove', onMousemove)
        }
        const onMousemove = (e) => {
          let endX = e.pageX
          let endY = e.pageY
          if (endY - pageY < 0 && endX - pageX < 0) {
            box.style.top = endY + "px"
            box.style.left = endX + "px"
            box.style.height = Math.abs(endY - pageY) + "px"
            box.style.width = Math.abs(endX - pageX) + "px"
          } else if (endY - pageY < 0) {
            box.style.top = endY + "px"
            box.style.left = pageX + "px"
            box.style.height = Math.abs(endY - pageY) + "px"
            box.style.width = Math.abs(endX - pageX) + "px"
          } else if (endX - pageX < 0) {
            box.style.top = pageY + "px"
            box.style.left = endX + "px"
            box.style.height = Math.abs(endY - pageY) + "px"
            box.style.width = Math.abs(endX - pageX) + "px"
          } else {
            box.style.top = pageY + "px"
            box.style.left = pageX + "px"
            box.style.height = endY - pageY + "px"
            box.style.width = endX - pageX + "px"
          }
          const { x: x2, y: y2 } = e.target.dataset
          this.selectFields(x1, y1, x2, y2, e.ctrlKey)
        }
        mapSide.addEventListener('mousemove', onMousemove)
        mapSide.addEventListener('mouseup', onMouseup)
      }
    })

    const deleteE = document.querySelector('.delete')
    const cut = document.querySelector('.cut')
    const undo = document.querySelector('.undo')
    const redo = document.querySelector('.redo')
    const save = document.querySelector('.save')
    const load = document.querySelector('#fileSelect')
    deleteE.addEventListener('click', this.delete)
    cut.addEventListener('click', this.cut)
    undo.addEventListener('click', this.undo)
    redo.addEventListener('click', this.redo)
    save.addEventListener('click', this.save)
    load.addEventListener('click', this.loadFromFile)

    const that = this
    function keyUpHandler(e) {
      e.preventDefault()
      e.stopPropagation();
      e = e || event;
      var keyCode = e.keyCode,
        letter = (String.fromCharCode(e.keyCode) || '').toLowerCase();

      if (e.ctrlKey && 's' === letter) {
        that.save()
      }
      if (e.ctrlKey && 'l' === letter) {
        that.loadFromFile()
      }
      if (e.ctrlKey && 'v' === letter) {
        alert("Paste");
      }
      if (e.ctrlKey && 'c' === letter) {
        alert("Copy");
      }
      if (e.ctrlKey && 'x' === letter) {
        that.cut()
      }
      if (e.ctrlKey && 'y' === letter) {
        that.redo()
      }
      if (e.ctrlKey && 'z' === letter) {
        that.undo()
      }
      if (e.keyCode === 46) {
        that.delete()
      }
      return false;
    }

    window.addEventListener('keydown', keyUpHandler)
  }

  delete = () => {
    const changes = []
    this.focusFields.forEach(field => {
      const div = document.querySelector(`.map-side [data-x="${field.x}"][data-y="${field.y}"]`)
      changes.push({
        x: field.x,
        y: field.y,
        bgi: div.style.backgroundImage,
        bgp: div.style.backgroundPosition
      })
      div.style.backgroundImage = 'none';
    })
    if (changes.length) this.undoMoves.push(changes)
    this.clearFields()
  }

  cut = () => {
    this.delete()
  }

  undo = () => {
    const redoPack = []
    if (this.undoMoves[this.undoMoves.length - 1]) {
      this.undoMoves[this.undoMoves.length - 1].forEach(move => {
        const div = document.querySelector(`.map-side [data-x="${move.x}"][data-y="${move.y}"]`)
        redoPack.push({
          x: move.x,
          y: move.y,
          bgi: div.style.backgroundImage,
          bgp: div.style.backgroundPosition
        })
        div.style.backgroundImage = move.bgi
        div.style.backgroundPosition = move.bgp
      })
      this.redoMoves.push(redoPack)
      this.undoMoves.pop()
    }
  }

  redo = () => {
    const undoPack = []
    if (this.redoMoves[this.redoMoves.length - 1]) {
      this.redoMoves[this.redoMoves.length - 1].forEach(move => {
        const div = document.querySelector(`.map-side [data-x="${move.x}"][data-y="${move.y}"]`)
        undoPack.push({
          x: move.x,
          y: move.y,
          bgi: div.style.backgroundImage,
          bgp: div.style.backgroundPosition
        })
        div.style.backgroundImage = move.bgi
        div.style.backgroundPosition = move.bgp
      })
      this.undoMoves.push(undoPack)
      this.redoMoves.pop()
    }
  }

  loadFromFile = () => {
    const fileElem = document.querySelector('#fileElem')
    fileElem.addEventListener('change', e => {
      var reader = new FileReader();
      reader.readAsText(e.target.files[0], "UTF-8")
      reader.onload = e => {
        const result = JSON.parse(e.target.result)
        result.forEach(item => {
          const div = document.querySelector(`.map-side [data-x="${item.x}"][data-y="${item.y}"]`)
          div.style.backgroundPosition = item.position
          if (item.position) {
            div.style.backgroundImage = "url('./sprite.png')"
          }
        })
      }
    })
    if (fileElem) {
      fileElem.click();
    }
  }
  save = () => {
    const toSave = []
    document.querySelectorAll('.mapItem').forEach(item => {
      const pack = {
        x: item.dataset.x,
        y: item.dataset.y,
        position: item.style.backgroundPosition
      }
      toSave.push(pack)
    })
    function download(content, fileName, contentType) {
      var a = document.createElement("a");
      var file = new Blob([content], { type: contentType });
      a.href = URL.createObjectURL(file);
      a.download = fileName;
      a.click();
    }
    download(JSON.stringify(toSave), 'map.json', 'application/json');
  }
}
