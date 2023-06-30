import { ref, onMounted } from 'vue'
import { ceil, floor, random, shuffle } from 'lodash-es'
import { useRouter } from 'vue-router'
const defaultGameConfig: GameConfig = {
  cardNum: 4,
  layerNum: 2,
  trap: true,
  delNode: false,
}

export function useGame(config: GameConfig): Game {
  const router = useRouter();
  const user_id = router.currentRoute.value.query.user_id;
  const { container, delNode, events = {}, ...initConfig } = { ...defaultGameConfig, ...config }
  const remainingBacks = ref(0); // Store remaining usage count for handleBack()
  const remainingRemoves = ref(0); // Store remaining usage count for handleRemove()
  const histroyList = ref<CardNode[]>([])
  const backFlag = ref(false)
  const removeFlag = ref(false)
  const removeList = ref<CardNode[]>([])
  const preNode = ref<CardNode | null>(null)
  const nodes = ref<CardNode[]>([])
  const indexSet = new Set()
  let perFloorNodes: CardNode[] = []
  const selectedNodes = ref<CardNode[]>([])
  const size = 40
  let floorList: number[][] = []

  function updateState() {
    nodes.value.forEach((o) => {
      o.state = o.parents.every(p => p.state > 0) ? 1 : 0
    })
  }

    // Fetch the initial usage count from the backend when the component is created
  async function fetchUsageCount() {
    if (user_id) {
      const response = await fetch(`http://127.0.0.1:8080/api/player/usage-count/${user_id}`);
      const data = await response.json();
      remainingBacks.value = data.backs;
      remainingRemoves.value = data.removes;
    } else {
      console.error('Player ID is not provided');
    }
  }

  function handleSelect(node: CardNode) {
    if (selectedNodes.value.length === 7)
      return
    node.state = 2
    histroyList.value.push(node)
    preNode.value = node
    const index = nodes.value.findIndex(o => o.id === node.id)
    if (index > -1)
      delNode && nodes.value.splice(index, 1)

    // 判断是否有可以消除的节点
    const selectedSomeNode = selectedNodes.value.filter(s => s.type === node.type)
    if (selectedSomeNode.length === 2) {
      // 第二个节点索引
      const secondIndex = selectedNodes.value.findIndex(o => o.id === selectedSomeNode[1].id)
      selectedNodes.value.splice(secondIndex + 1, 0, node)
      // 为了动画效果添加延迟
      setTimeout(() => {
        for (let i = 0; i < 3; i++) {
          // const index = selectedNodes.value.findIndex(o => o.type === node.type)
          selectedNodes.value.splice(secondIndex - 1, 1)
        }
        preNode.value = null
        // 判断是否已经清空节点，即是否胜利
        if (delNode ? nodes.value.length === 0 : nodes.value.every(o => o.state > 0) && removeList.value.length === 0 && selectedNodes.value.length === 0) {
          removeFlag.value = true
          backFlag.value = true
          events.winCallback && events.winCallback()
        }
        else {
          events.dropCallback && events.dropCallback()
        }
      }, 100)
    }
    else {
      events.clickCallback && events.clickCallback()
      const index = selectedNodes.value.findIndex(o => o.type === node.type)
      if (index > -1)
        selectedNodes.value.splice(index + 1, 0, node)
      else
        selectedNodes.value.push(node)
      // 判断卡槽是否已满，即失败
      if (selectedNodes.value.length === 7) {
        removeFlag.value = true
        backFlag.value = true
        events.loseCallback && events.loseCallback()
      }
    }
  }

  function handleSelectRemove(node: CardNode) {
    const index = removeList.value.findIndex(o => o.id === node.id)
    if (index > -1)
      removeList.value.splice(index, 1)
    handleSelect(node)
  }

  // Update the handleBack() function to check the remaining usage count and decrement it
  async function handleBack() {
    // Fetch the latest usage count
    await fetchUsageCount();
  
    if (remainingBacks.value <= 0) {
      // If no remaining usage, return early
      return;
    }
    
    const node = preNode.value;
    if (!node) {
      return;
    }
    
    preNode.value = null;
    backFlag.value = true;
    node.state = 0;
    delNode && nodes.value.push(node);
    const index = selectedNodes.value.findIndex(o => o.id === node.id);
    selectedNodes.value.splice(index, 1);
    
    const response = await fetch(`http://127.0.0.1:8080/api/player/use-back/${user_id}`, { method: 'POST' });
    const data = await response.json();
    remainingBacks.value = data.backs;
}

  async function handleRemove() {
    // Fetch the latest usage count
    await fetchUsageCount();
  
    if (remainingRemoves.value <= 0) {
      // If no remaining usage, return early
      return;
    }
    if (selectedNodes.value.length < 3) {
      return;
    }
    removeFlag.value = true;
    preNode.value = null;
    for (let i = 0; i < 3; i++) {
      const node = selectedNodes.value.shift();
      if (!node) {
        return;
      }
      removeList.value.push(node);
    }
    // Decrement the remaining usage count
    const response = await fetch(`http://127.0.0.1:8080/api/player/use-remove/${user_id}`, { method: 'POST' });
    const data = await response.json();
    remainingRemoves.value = data.removes;
}

  onMounted(fetchUsageCount);

  function initData(config?: GameConfig | null) {
    const { cardNum, layerNum, trap } = { ...initConfig, ...config }
    histroyList.value = []
    backFlag.value = false
    removeFlag.value = false
    removeList.value = []
    preNode.value = null
    nodes.value = []
    indexSet.clear()
    perFloorNodes = []
    selectedNodes.value = []
    floorList = []
    const isTrap = trap && floor(random(0, 100)) !== 50

    // 生成节点池
    const itemTypes = (new Array(cardNum).fill(0)).map((_, index) => index + 1)
    let itemList: number[] = []
    for (let i = 0; i < 3 * layerNum; i++)
      itemList = [...itemList, ...itemTypes]

    if (isTrap) {
      const len = itemList.length
      itemList.splice(len - cardNum, len)
    }
    // 打乱节点
    itemList = shuffle(shuffle(itemList))

    // 初始化各个层级节点
    let len = 0
    let floorIndex = 1
    const itemLength = itemList.length
    while (len <= itemLength) {
      const maxFloorNum = floorIndex * floorIndex
      const floorNum = ceil(random(maxFloorNum / 2, maxFloorNum))
      floorList.push(itemList.splice(0, floorNum))
      len += floorNum
      floorIndex++
    }
    const containerWidth = container.value!.clientWidth
    const containerHeight = container.value!.clientHeight
    const width = containerWidth / 2
    const height = containerHeight / 2 - 60

    floorList.forEach((o, index) => {
      indexSet.clear()
      let i = 0
      const floorNodes: CardNode[] = []
      o.forEach((k) => {
        i = floor(random(0, (index + 1) ** 2))
        while (indexSet.has(i))
          i = floor(random(0, (index + 1) ** 2))
        const row = floor(i / (index + 1))
        const column = index ? i % index : 0
        const node: CardNode = {
          id: `${index}-${i}`,
          type: k,
          zIndex:
        index,
          index: i,
          row,
          column,
          top: height + (size * row - (size / 2) * index),
          left: width + (size * column - (size / 2) * index),
          parents: [],
          state: 0,
        }
        const xy = [node.top, node.left]
        perFloorNodes.forEach((e) => {
          if (Math.abs(e.top - xy[0]) <= size && Math.abs(e.left - xy[1]) <= size)
            e.parents.push(node)
        })
        floorNodes.push(node)
        indexSet.add(i)
      })
      nodes.value = nodes.value.concat(floorNodes)
      perFloorNodes = floorNodes
    })

    updateState()
  }

  return {
    nodes,
    selectedNodes,
    removeFlag,
    removeList,
    backFlag,
    handleSelect,
    remainingBacks,
    remainingRemoves,
    handleBack,
    handleRemove,
    handleSelectRemove,
    initData,
    fetchUsageCount
  }
}
