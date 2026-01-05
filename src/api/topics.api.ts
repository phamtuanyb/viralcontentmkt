import { supabase } from "@/integrations/supabase/client";

export interface Topic {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: "active" | "hidden";
  sort_order: number;
  parent_id: string | null;
  level: number;
  order_index: number;
  created_at: string;
}

export interface TopicWithChildren extends Topic {
  children?: TopicWithChildren[];
}

export const topicsApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from("topics")
      .select("*")
      .order("parent_id", { ascending: true, nullsFirst: true })
      .order("order_index", { ascending: true });

    return { data: data as Topic[] | null, error };
  },

  getActive: async () => {
    const { data, error } = await supabase
      .from("topics")
      .select("*")
      .eq("status", "active")
      .order("parent_id", { ascending: true, nullsFirst: true })
      .order("order_index", { ascending: true });

    return { data: data as Topic[] | null, error };
  },

  getActiveWithVisibleParent: async () => {
    // First get all active topics
    const { data: allTopics, error } = await supabase
      .from("topics")
      .select("*")
      .order("parent_id", { ascending: true, nullsFirst: true })
      .order("order_index", { ascending: true });

    if (error || !allTopics) return { data: null, error };

    // Filter to only show topics where the entire parent chain is active
    const topicMap = new Map<string, Topic>();
    allTopics.forEach(t => topicMap.set(t.id, t as Topic));

    const isVisibleTopic = (topic: Topic): boolean => {
      if (topic.status !== "active") return false;
      if (!topic.parent_id) return true;
      const parent = topicMap.get(topic.parent_id);
      if (!parent) return true;
      return isVisibleTopic(parent);
    };

    const visibleTopics = allTopics.filter(t => isVisibleTopic(t as Topic));
    return { data: visibleTopics as Topic[], error: null };
  },

  create: async (topic: { 
    name: string; 
    slug: string; 
    description?: string; 
    status?: "active" | "hidden"; 
    parent_id?: string | null;
    order_index?: number;
  }) => {
    const { data, error } = await supabase
      .from("topics")
      .insert([{
        name: topic.name,
        slug: topic.slug,
        description: topic.description,
        status: topic.status || "active",
        parent_id: topic.parent_id || null,
        order_index: topic.order_index || 0,
      }])
      .select()
      .single();

    return { data, error };
  },

  update: async (id: string, topic: Partial<Topic>) => {
    const { data, error } = await supabase
      .from("topics")
      .update(topic)
      .eq("id", id)
      .select()
      .single();

    return { data, error };
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from("topics")
      .delete()
      .eq("id", id);

    return { error };
  },

  reorder: async (id: string, newOrderIndex: number, parentId: string | null) => {
    const { data, error } = await supabase
      .from("topics")
      .update({ order_index: newOrderIndex, parent_id: parentId })
      .eq("id", id)
      .select()
      .single();

    return { data, error };
  },

  // Build tree structure from flat list
  buildTree: (topics: Topic[]): TopicWithChildren[] => {
    const topicMap = new Map<string, TopicWithChildren>();
    const roots: TopicWithChildren[] = [];

    // First pass: create map
    topics.forEach(topic => {
      topicMap.set(topic.id, { ...topic, children: [] });
    });

    // Second pass: build tree
    topics.forEach(topic => {
      const node = topicMap.get(topic.id)!;
      if (topic.parent_id && topicMap.has(topic.parent_id)) {
        const parent = topicMap.get(topic.parent_id)!;
        parent.children = parent.children || [];
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  },

  // Get siblings (topics with same parent)
  getSiblings: (topics: Topic[], parentId: string | null): Topic[] => {
    return topics.filter(t => t.parent_id === parentId).sort((a, b) => a.order_index - b.order_index);
  },

  // Check if moving to a parent would exceed depth limit
  canMoveToParent: (topics: Topic[], topicId: string, newParentId: string | null): boolean => {
    if (!newParentId) return true; // Moving to root is always allowed
    
    const topicMap = new Map<string, Topic>();
    topics.forEach(t => topicMap.set(t.id, t));

    // Check if newParentId is a descendant of topicId (would create circular ref)
    let current: Topic | undefined = topicMap.get(newParentId);
    while (current) {
      if (current.id === topicId) return false; // Circular reference
      current = current.parent_id ? topicMap.get(current.parent_id) : undefined;
    }

    // Calculate new depth
    const parent = topicMap.get(newParentId);
    if (!parent) return false;
    
    // Get max depth of topic's subtree
    const getMaxDepth = (id: string, currentDepth: number): number => {
      const children = topics.filter(t => t.parent_id === id);
      if (children.length === 0) return currentDepth;
      return Math.max(...children.map(c => getMaxDepth(c.id, currentDepth + 1)));
    };

    const topic = topicMap.get(topicId);
    if (!topic) return false;

    const subtreeDepth = getMaxDepth(topicId, 0);
    const newLevel = parent.level + 1;
    
    // Max level is 2 (0, 1, 2), so check if subtree would exceed
    return (newLevel + subtreeDepth) <= 2;
  },
};
