-- Add hierarchical fields to topics table
ALTER TABLE public.topics 
ADD COLUMN parent_id uuid REFERENCES public.topics(id) ON DELETE SET NULL,
ADD COLUMN level integer NOT NULL DEFAULT 0,
ADD COLUMN order_index integer NOT NULL DEFAULT 0;

-- Create index for efficient hierarchical queries
CREATE INDEX idx_topics_parent_id ON public.topics(parent_id);
CREATE INDEX idx_topics_hierarchy ON public.topics(parent_id, order_index);

-- Function to compute level based on parent
CREATE OR REPLACE FUNCTION public.compute_topic_level(p_parent_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN p_parent_id IS NULL THEN 0
    ELSE (SELECT level + 1 FROM public.topics WHERE id = p_parent_id)
  END
$$;

-- Function to check for circular references
CREATE OR REPLACE FUNCTION public.check_topic_circular_reference(p_topic_id uuid, p_parent_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_parent uuid := p_parent_id;
BEGIN
  -- If no parent, no circular reference possible
  IF p_parent_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Traverse up the tree to check for cycles
  WHILE current_parent IS NOT NULL LOOP
    IF current_parent = p_topic_id THEN
      RETURN TRUE; -- Circular reference detected
    END IF;
    SELECT parent_id INTO current_parent FROM public.topics WHERE id = current_parent;
  END LOOP;
  
  RETURN FALSE;
END;
$$;

-- Function to get next order_index for a parent
CREATE OR REPLACE FUNCTION public.get_next_topic_order_index(p_parent_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(MAX(order_index) + 1, 0) 
  FROM public.topics 
  WHERE (parent_id = p_parent_id) OR (p_parent_id IS NULL AND parent_id IS NULL)
$$;

-- Trigger to validate topic hierarchy on insert/update
CREATE OR REPLACE FUNCTION public.validate_topic_hierarchy()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_level integer;
BEGIN
  -- Check for circular reference
  IF NEW.parent_id IS NOT NULL AND public.check_topic_circular_reference(NEW.id, NEW.parent_id) THEN
    RAISE EXCEPTION 'Circular reference detected in topic hierarchy';
  END IF;
  
  -- Compute and validate level
  new_level := public.compute_topic_level(NEW.parent_id);
  
  -- Limit depth to 3 levels (0, 1, 2)
  IF new_level > 2 THEN
    RAISE EXCEPTION 'Topic hierarchy cannot exceed 3 levels (max depth is 2)';
  END IF;
  
  -- Set the computed level
  NEW.level := new_level;
  
  -- If order_index is 0 and it's a new insert, get next available index
  IF TG_OP = 'INSERT' AND NEW.order_index = 0 THEN
    NEW.order_index := public.get_next_topic_order_index(NEW.parent_id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER validate_topic_hierarchy_trigger
BEFORE INSERT OR UPDATE ON public.topics
FOR EACH ROW
EXECUTE FUNCTION public.validate_topic_hierarchy();

-- Recursive function to update child levels when parent changes
CREATE OR REPLACE FUNCTION public.update_child_topic_levels()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only run if parent_id changed
  IF OLD.parent_id IS DISTINCT FROM NEW.parent_id OR OLD.level IS DISTINCT FROM NEW.level THEN
    -- Update all direct children's levels (will cascade through trigger)
    UPDATE public.topics 
    SET level = NEW.level + 1
    WHERE parent_id = NEW.id AND level != NEW.level + 1;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for cascading level updates
CREATE TRIGGER update_child_levels_trigger
AFTER UPDATE ON public.topics
FOR EACH ROW
EXECUTE FUNCTION public.update_child_topic_levels();

-- Initialize existing topics with order_index based on current sort_order
UPDATE public.topics SET order_index = sort_order WHERE order_index = 0;