import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { showToast } from "vant";
import {
  addToCart,
  getCartList,
  updateCartItem,
  removeCartItem,
} from "../utils/api";

export const useCartStore = defineStore("cart", () => {
  const cartItems = ref([]);
  const loading = ref(false);

  // 计算属性
  const cartCount = computed(() => {
    return cartItems.value.reduce((total, item) => total + item.quantity, 0);
  });

  const totalAmount = computed(() => {
    return cartItems.value.reduce((total, item) => {
      const price = item.discount_price || item.sale_price;
      return total + price * item.quantity;
    }, 0);
  });

  // 获取购物车列表
  const fetchCartList = async () => {
    try {
      loading.value = true;
      const response = await getCartList();
      if (response.success) {
        // 为每个购物车项目添加 checked 属性
        cartItems.value = (response.data || []).map((item) => ({
          ...item,
          checked: false,
        }));
      } else {
        cartItems.value = [];
        showToast(response.message || "获取购物车失败");
      }
    } catch (error) {
      cartItems.value = [];
      showToast("网络错误");
    } finally {
      loading.value = false;
    }
  };

  // 添加到购物车
  const addItem = async (productId, quantity = 1) => {
    try {
      const response = await addToCart({ product_id: productId, quantity });
      if (response.success) {
        showToast("已添加到购物车");
        await fetchCartList();
        return true;
      } else {
        showToast(response.message || "添加失败");
        return false;
      }
    } catch (error) {
      showToast("网络错误");
      return false;
    }
  };

  // 更新商品数量
  const updateQuantity = async (cartItemId, quantity) => {
    try {
      const response = await updateCartItem(cartItemId, { quantity });
      if (response.success) {
        const item = cartItems.value.find((item) => item.id === cartItemId);
        if (item) {
          item.quantity = quantity;
        }
        return true;
      } else {
        showToast(response.message || "更新失败");
        return false;
      }
    } catch (error) {
      showToast("网络错误");
      return false;
    }
  };

  // 删除商品
  const removeItem = async (cartItemId) => {
    try {
      const response = await removeCartItem(cartItemId);
      if (response.success) {
        cartItems.value = cartItems.value.filter(
          (item) => item.id !== cartItemId
        );
        showToast("已删除");
        return true;
      } else {
        showToast(response.message || "删除失败");
        return false;
      }
    } catch (error) {
      showToast("网络错误");
      return false;
    }
  };

  // 清空购物车
  const clearCart = () => {
    cartItems.value = [];
  };

  return {
    cartItems,
    loading,
    cartCount,
    totalAmount,
    fetchCartList,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
  };
});
